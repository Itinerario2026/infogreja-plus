import express from "express";
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
    return "minha-paroquia-session-secret-production";
  }
}

function id(prefix) {
  return `${prefix}${Date.now()}${crypto.randomInt(100, 999)}`;
}

function makeRecoveryCode() {
  const raw = crypto.randomBytes(12).toString("hex").toUpperCase();
  return `MP-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20, 24)}`;
}

function safeEqualText(a, b) {
  const hash = value => crypto.createHash("sha256").update(String(value || "")).digest();
  return crypto.timingSafeEqual(hash(a), hash(b));
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
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Sessão stateless via HMAC assinado: funciona perfeitamente na Vercel (serverless) e localmente
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 8;
const SESSION_SECRET = getSessionSecret();
const COOKIE_SECURE = (process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL)) && !process.env.DEV_OVERRIDE;

function signValue(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function createSessionToken(email) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + SESSION_MAX_AGE_MS })).toString("base64url");
  return `${payload}.${signValue(payload)}`;
}

function readSessionToken(token) {
  if (!token || typeof token !== "string") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(signValue(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.email || !data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map(part => part.trim()).filter(Boolean).map(part => {
      const i = part.indexOf("=");
      return [part.slice(0, i), decodeURIComponent(part.slice(i + 1))];
    })
  );
}

app.use((req, _res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies["minha-paroquia.sid"] || cookies["infogreja.sid"];
  const data = readSessionToken(token);
  req.session = data ? { admin: { email: data.email } } : {};
  next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas de login. Aguarde alguns minutos." }
});

const recoveryLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas de recuperação. Aguarde alguns minutos." }
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
    const registration = {
      id: id("r"),
      churchId,
      pastoralId,
      item,
      name,
      phone,
      email,
      note,
      createdAt: new Date().toISOString()
    };
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
    const contact = {
      id: id("m"),
      churchId,
      pastoralId,
      name,
      email,
      message,
      createdAt: new Date().toISOString()
    };
    await db.addContact(contact);
    res.status(201).json({ message: "Mensagem enviada com sucesso." });
  } catch (err) {
    next(err);
  }
});

// Pesquisa de músicas via iTunes Music API (sem necessidade de chaves, pública e rápida)
app.get("/api/public/music-search", async (req, res) => {
  try {
    const term = String(req.query.q || "").trim();
    if (!term) return res.json({ results: [] });
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=10&country=BR`;
    const response = await fetch(url, { headers: { "User-Agent": "MinhaParoquia/1.0" } });
    if (!response.ok) return res.json({ results: [] });
    const data = await response.json();
    const results = (data.results || []).map(r => ({
      id: String(r.trackId),
      title: r.trackName,
      artist: r.artistName,
      album: r.collectionName,
      image: r.artworkUrl100?.replace("100x100bb", "400x400bb") || r.artworkUrl100 || "",
      audioUrl: r.previewUrl || "",
      externalUrl: r.trackViewUrl || ""
    }));
    res.json({ results });
  } catch (err) {
    console.warn("Aviso ao buscar músicas:", err.message);
    res.json({ results: [] });
  }
});

app.post("/api/public/music-suggestions", async (req, res, next) => {
  try {
    const { churchId, pastoralId = "", title, artist = "", suggestedBy = "", moment = "", note = "", image = "", audioUrl = "", externalUrl = "" } = req.body;
    if (!churchId || !title?.trim()) {
      return res.status(400).json({ message: "Preencha a paróquia e o título da música." });
    }
    const publicData = await db.getPublicData();
    if (!publicData.churches.some(c => c.id === churchId)) {
      return res.status(400).json({ message: "Paróquia inválida." });
    }
    const suggestion = {
      id: id("mus"),
      churchId,
      pastoralId,
      title: title.trim(),
      artist: artist.trim(),
      suggestedBy: (suggestedBy || "Membro da Comunidade").trim(),
      moment: moment.trim(),
      note: note.trim(),
      image: image.trim(),
      audioUrl: audioUrl.trim(),
      externalUrl: externalUrl.trim(),
      status: "pending",
      adminFeedback: "",
      createdAt: new Date().toISOString()
    };
    await db.addMusicSuggestion(suggestion);
    res.status(201).json({ message: "Sugestão de música enviada com sucesso! A coordenação da pastoral irá revisar.", suggestion });
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
      return res.status(503).json({ message: "Administrador ainda não configurado. Execute INICIAR_SITE.bat." });
    }

    const emailOk = safeEqualText(email, admin.email);
    const passwordOk = emailOk ? await bcrypt.compare(password, admin.passwordHash) : false;

    if (!emailOk || !passwordOk) {
      return res.status(401).json({ message: "E-mail ou senha inválidos." });
    }

    const token = createSessionToken(admin.email);
    const cookieOpts = {
      httpOnly: true,
      sameSite: "lax",
      secure: COOKIE_SECURE,
      path: "/",
      maxAge: SESSION_MAX_AGE_MS
    };

    res.cookie("minha-paroquia.sid", token, cookieOpts);
    res.cookie("infogreja.sid", token, cookieOpts);
    res.json({ email: admin.email });
  } catch (err) {
    next(err);
  }
});

app.post("/api/auth/recover", recoveryLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const recoveryCode = String(req.body.recoveryCode || "").trim().toUpperCase();
    const newPassword = String(req.body.newPassword || "");

    if (!email || !recoveryCode || newPassword.length < 8) {
      return res.status(400).json({ message: "Informe e-mail, chave de recuperação e uma nova senha com pelo menos 8 caracteres." });
    }

    const admin = await db.getAdmin(email);
    if (!admin) {
      return res.status(503).json({ message: "Administrador ainda não configurado." });
    }
    if (!admin.recoveryHash) {
      return res.status(409).json({ message: "A recuperação ainda não está configurada para este administrador. Execute REDEFINIR_SENHA.bat no computador do sistema." });
    }

    const emailOk = safeEqualText(email, admin.email);
    const recoveryOk = emailOk ? await bcrypt.compare(recoveryCode, admin.recoveryHash) : false;
    if (!emailOk || !recoveryOk) {
      return res.status(401).json({ message: "E-mail ou chave de recuperação inválidos." });
    }

    const newRecoveryCode = makeRecoveryCode();
    const [passwordHash, recoveryHash] = await Promise.all([
      bcrypt.hash(newPassword, 12),
      bcrypt.hash(newRecoveryCode, 12)
    ]);

    await db.updateAdminPasswordAndRecovery(email, passwordHash, recoveryHash);

    const clearOpts = { httpOnly: true, sameSite: "lax", secure: COOKIE_SECURE, path: "/" };
    res.clearCookie("minha-paroquia.sid", clearOpts);
    res.clearCookie("infogreja.sid", clearOpts);
    res.json({
      message: "Senha redefinida com sucesso. Guarde a nova chave de recuperação.",
      newRecoveryCode
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session?.admin?.email) return res.status(401).json({ message: "Não autenticado." });
  res.json({ email: req.session.admin.email });
});

app.post("/api/auth/logout", (_req, res) => {
  const clearOpts = { httpOnly: true, sameSite: "lax", secure: COOKIE_SECURE, path: "/" };
  res.clearCookie("minha-paroquia.sid", clearOpts);
  res.clearCookie("infogreja.sid", clearOpts);
  res.json({ message: "Sessão encerrada." });
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

app.put("/api/admin/music-suggestions/:id", requireAdmin, async (req, res, next) => {
  try {
    const allowed = ["status", "adminFeedback", "moment", "title", "artist", "note", "image", "audioUrl", "externalUrl"];
    const payload = {};
    for (const key of allowed) {
      if (typeof req.body[key] === "string") payload[key] = req.body[key].trim();
    }
    const updated = await db.updateMusicSuggestion(req.params.id, payload);
    if (!updated) return res.status(404).json({ message: "Sugestão não encontrada." });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.post("/api/admin/music-suggestions", requireAdmin, async (req, res, next) => {
  try {
    const { churchId, pastoralId = "", title, artist = "", moment = "", note = "", image = "", audioUrl = "", externalUrl = "", status = "approved", adminFeedback = "" } = req.body;
    if (!churchId || !title?.trim()) {
      return res.status(400).json({ message: "Preencha a paróquia e o título da música." });
    }
    const suggestion = {
      id: id("mus"),
      churchId,
      pastoralId,
      title: title.trim(),
      artist: artist.trim(),
      suggestedBy: "Coordenação de Música",
      moment: moment.trim(),
      note: note.trim(),
      image: image.trim(),
      audioUrl: audioUrl.trim(),
      externalUrl: externalUrl.trim(),
      status: status || "approved",
      adminFeedback: adminFeedback.trim(),
      createdAt: new Date().toISOString()
    };
    await db.addMusicSuggestion(suggestion);
    res.status(201).json(suggestion);
  } catch (err) {
    next(err);
  }
});

app.delete("/api/admin/music-suggestions/:id", requireAdmin, async (req, res, next) => {
  try {
    const success = await db.deleteMusicSuggestion(req.params.id);
    if (!success) return res.status(404).json({ message: "Sugestão não encontrada." });
    res.json({ message: "Sugestão de música excluída." });
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
