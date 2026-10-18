import express from "express";
import session from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db, isSupabaseConfigured } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const SECRET_FILE = path.join(__dirname, "data", ".session-secret");
const PORT = Number(process.env.PORT || 3001);

function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  try {
    if (fs.existsSync(SECRET_FILE)) return fs.readFileSync(SECRET_FILE, "utf8").trim();
    const secret = crypto.randomBytes(48).toString("hex");
    fs.writeFileSync(SECRET_FILE, secret, { mode: 0o600 });
    return secret;
  } catch {
    return "infogreja-plus-default-session-secret-change-in-env";
  }
}

function id(prefix) {
  return `${prefix}${Date.now()}${crypto.randomInt(100, 999)}`;
}

const collectionByType = {
  church: "churches",
  event: "events",
  activity: "activities",
  notice: "notices",
  group: "groups",
  schedule: "schedules",
  program: "programs"
};

const app = express();
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "250kb" }));
app.use(session({
  name: "infogreja.sid",
  secret: getSessionSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.DEV_OVERRIDE,
    maxAge: 1000 * 60 * 60 * 8
  }
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas de login. Aguarde alguns minutos." }
});

function requireAdmin(req, res, next) {
  if (!req.session?.admin?.email) return res.status(401).json({ message: "Acesso administrativo não autorizado." });
  next();
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    storage: isSupabaseConfigured ? "supabase" : "local_json"
  });
});

app.get("/api/public/data", async (req, res, next) => {
  try {
    const data = await db.getPublicData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.post("/api/public/registrations", async (req, res, next) => {
  try {
    const { churchId, pastoralId = "", item, name, phone, email, note = "" } = req.body;
    if (!churchId || !item || !name || !phone || !email) {
      return res.status(400).json({ message: "Preencha todos os campos obrigatórios." });
    }
    const publicData = await db.getPublicData();
    if (!publicData.churches.some(c => c.id === churchId)) {
      return res.status(400).json({ message: "Igreja inválida." });
    }
    if (pastoralId && !publicData.pastorals.some(p => p.id === pastoralId && p.churchId === churchId)) {
      return res.status(400).json({ message: "Pastoral inválida para esta igreja." });
    }
    const registration = { id: id("r"), churchId, pastoralId, item, name, phone, email, note, createdAt: new Date().toISOString() };
    await db.addRegistration(registration);
    res.status(201).json({ message: "Inscrição realizada com sucesso." });
  } catch (err) {
    next(err);
  }
});

app.post("/api/public/contacts", async (req, res, next) => {
  try {
    const { churchId, pastoralId = "", name, email, message } = req.body;
    if (!churchId || !name || !email || !message) {
      return res.status(400).json({ message: "Preencha todos os campos." });
    }
    const publicData = await db.getPublicData();
    if (!publicData.churches.some(c => c.id === churchId)) {
      return res.status(400).json({ message: "Igreja inválida." });
    }
    if (pastoralId && !publicData.pastorals.some(p => p.id === pastoralId && p.churchId === churchId)) {
      return res.status(400).json({ message: "Pastoral inválida para esta igreja." });
    }
    const contact = { id: id("m"), churchId, pastoralId, name, email, message, createdAt: new Date().toISOString() };
    await db.addContact(contact);
    res.status(201).json({ message: "Mensagem enviada com sucesso." });
  } catch (err) {
    next(err);
  }
});

app.post("/api/auth/login", loginLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const admin = await db.getAdmin(email);

    if (!admin) {
      return res.status(401).json({ message: "Administrador não encontrado ou credenciais inválidas." });
    }

    const emailHash = value => crypto.createHash("sha256").update(value).digest();
    const emailOk = crypto.timingSafeEqual(emailHash(email), emailHash(admin.email));
    const passwordOk = emailOk ? await bcrypt.compare(password, admin.passwordHash) : false;

    if (!emailOk || !passwordOk) {
      return res.status(401).json({ message: "E-mail ou senha inválidos." });
    }

    req.session.regenerate(err => {
      if (err) return res.status(500).json({ message: "Não foi possível iniciar a sessão." });
      req.session.admin = { email: admin.email };
      res.json({ email: admin.email });
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session?.admin?.email) return res.status(401).json({ message: "Não autenticado." });
  res.json({ email: req.session.admin.email });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("infogreja.sid");
    res.json({ message: "Sessão encerrada." });
  });
});

app.get("/api/admin/data", requireAdmin, async (req, res, next) => {
  try {
    const data = await db.getAdminData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.post("/api/admin/content", requireAdmin, async (req, res, next) => {
  try {
    const { type, ...payload } = req.body;
    const collection = collectionByType[type];
    if (!collection) return res.status(400).json({ message: "Tipo de conteúdo inválido." });
    if (!payload.title?.trim()) return res.status(400).json({ message: "Título é obrigatório." });

    const adminData = await db.getAdminData();
    if (type !== "church" && (!payload.churchId || !adminData.churches.some(c => c.id === payload.churchId))) {
      return res.status(400).json({ message: "Selecione uma igreja válida." });
    }
    if (payload.pastoralId && !adminData.pastorals.some(p => p.id === payload.pastoralId && p.churchId === payload.churchId)) {
      return res.status(400).json({ message: "Selecione uma pastoral válida para esta igreja." });
    }

    const item = { id: id(type[0]), ...payload, title: payload.title.trim() };
    await db.addContent(type, item);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

app.put("/api/admin/churches/:id", requireAdmin, async (req, res, next) => {
  try {
    const allowed = ["title", "subtitle", "description", "location", "phone", "email", "whatsapp", "pastor", "map", "image", "instagram"];
    const payload = {};
    for (const key of allowed) {
      if (typeof req.body[key] === "string") payload[key] = req.body[key].trim();
    }
    const updated = await db.updateChurch(req.params.id, payload);
    if (!updated) return res.status(404).json({ message: "Igreja não encontrada." });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.put("/api/admin/pastorals/:id", requireAdmin, async (req, res, next) => {
  try {
    const allowed = ["description", "coordinator", "phone", "whatsapp", "email", "meetingDay", "meetingTime", "location"];
    const payload = {};
    for (const key of allowed) {
      if (typeof req.body[key] === "string") payload[key] = req.body[key].trim();
    }
    const updated = await db.updatePastoral(req.params.id, payload);
    if (!updated) return res.status(404).json({ message: "Pastoral não encontrada." });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.delete("/api/admin/content/:type/:id", requireAdmin, async (req, res, next) => {
  try {
    const collection = collectionByType[req.params.type];
    if (!collection || req.params.type === "church") return res.status(400).json({ message: "Exclusão não permitida para este tipo." });
    const success = await db.deleteContent(req.params.type, req.params.id);
    if (!success) return res.status(404).json({ message: "Conteúdo não encontrado." });
    res.json({ message: "Conteúdo excluído." });
  } catch (err) {
    next(err);
  }
});

app.post("/api/admin/reset-content", requireAdmin, async (req, res, next) => {
  try {
    await db.resetContent();
    res.json({ message: "Conteúdo restaurado com sucesso; inscrições e contatos preservados." });
  } catch (err) {
    next(err);
  }
});

// Serve frontend build if exists
const dist = path.join(ROOT_DIR, "client", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) return res.sendFile(path.join(dist, "index.html"));
    next();
  });
}

app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res.status(500).json({ message: "Erro interno do servidor." });
});

// Only start standalone listener when not imported as a serverless function
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`API Node.js: http://localhost:${PORT}`);
    console.log(`Armazenamento: ${isSupabaseConfigured ? "Supabase Cloud" : "Local JSON"}`);
  });
}

export default app;
