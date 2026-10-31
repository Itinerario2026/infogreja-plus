import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT_DIR, ".env") });
dotenv.config({ path: path.join(__dirname, ".env") });

const DB_FILE = path.join(__dirname, "data", "database.json");
const DEFAULT_DB_FILE = path.join(__dirname, "data", "database.default.json");
const ADMIN_FILE = path.join(__dirname, "data", "admin.json");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wxjzewhqbbvvarotpeyg.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

let supabase = null;
if (isSupabaseConfigured) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
  });
}

const PUBLIC_TABLES = [
  "churches",
  "pastorals",
  "events",
  "activities",
  "notices",
  "groups",
  "schedules",
  "programs"
];

const ALL_TABLES = [...PUBLIC_TABLES, "registrations", "contacts", "music_suggestions"];

const collectionByType = {
  church: "churches",
  event: "events",
  activity: "activities",
  notice: "notices",
  group: "groups",
  schedule: "schedules",
  program: "programs"
};

// Fallback JSON Helpers
function readLocalDb() {
  if (!fs.existsSync(DB_FILE)) {
    if (fs.existsSync(DEFAULT_DB_FILE)) {
      fs.copyFileSync(DEFAULT_DB_FILE, DB_FILE);
    } else {
      return {};
    }
  }
  const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  for (const field of ALL_TABLES) {
    if (!Array.isArray(data[field])) data[field] = [];
  }
  return data;
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("Aviso: Não foi possível gravar localmente em disco (esperado no Vercel serverless):", err.message);
  }
}

export const db = {
  async getPublicData() {
    if (supabase) {
      try {
        const results = await Promise.all([
          ...PUBLIC_TABLES.map(table => supabase.from(table).select("*")),
          supabase.from("music_suggestions").select("*").eq("status", "approved")
        ]);
        const data = {};
        for (let i = 0; i < PUBLIC_TABLES.length; i++) {
          const table = PUBLIC_TABLES[i];
          const res = results[i];
          if (res.error) throw res.error;
          data[table] = res.data || [];
        }
        const musicRes = results[PUBLIC_TABLES.length];
        data.music_suggestions = (!musicRes.error && musicRes.data) ? musicRes.data : [];
        return data;
      } catch (err) {
        console.warn("Aviso ao buscar dados no Supabase, usando fallback local:", err.message);
      }
    }
    const local = readLocalDb();
    const { registrations, contacts, ...publicData } = local;
    publicData.music_suggestions = (local.music_suggestions || []).filter(m => m.status === "approved");
    return publicData;
  },

  async getAdminData() {
    if (supabase) {
      try {
        const results = await Promise.all(
          ALL_TABLES.map(table => supabase.from(table).select("*"))
        );
        const data = {};
        for (let i = 0; i < ALL_TABLES.length; i++) {
          const table = ALL_TABLES[i];
          const res = results[i];
          if (res.error) throw res.error;
          data[table] = res.data || [];
        }
        return data;
      } catch (err) {
        console.warn("Aviso ao buscar admin data no Supabase, usando fallback local:", err.message);
      }
    }
    return readLocalDb();
  },

  async addRegistration(registration) {
    if (supabase) {
      try {
        const { error } = await supabase.from("registrations").insert([registration]);
        if (error) throw error;
        return registration;
      } catch (err) {
        console.warn("Aviso ao salvar inscrição no Supabase, gravando local:", err.message);
      }
    }
    const local = readLocalDb();
    local.registrations.push(registration);
    writeLocalDb(local);
    return registration;
  },

  async addContact(contact) {
    if (supabase) {
      try {
        const { error } = await supabase.from("contacts").insert([contact]);
        if (error) throw error;
        return contact;
      } catch (err) {
        console.warn("Aviso ao salvar contato no Supabase, gravando local:", err.message);
      }
    }
    const local = readLocalDb();
    local.contacts.push(contact);
    writeLocalDb(local);
    return contact;
  },

  async addMusicSuggestion(suggestion) {
    if (supabase) {
      try {
        const { error } = await supabase.from("music_suggestions").insert([suggestion]);
        if (error) throw error;
        return suggestion;
      } catch (err) {
        console.warn("Aviso ao salvar sugestão de música no Supabase, gravando local:", err.message);
      }
    }
    const local = readLocalDb();
    if (!Array.isArray(local.music_suggestions)) local.music_suggestions = [];
    local.music_suggestions.push(suggestion);
    writeLocalDb(local);
    return suggestion;
  },

  async updateMusicSuggestion(id, payload) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("music_suggestions").update(payload).eq("id", id).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn("Aviso ao atualizar sugestão de música no Supabase, gravando local:", err.message);
      }
    }
    const local = readLocalDb();
    if (!Array.isArray(local.music_suggestions)) local.music_suggestions = [];
    const idx = local.music_suggestions.findIndex(m => m.id === id);
    if (idx < 0) return null;
    local.music_suggestions[idx] = { ...local.music_suggestions[idx], ...payload };
    writeLocalDb(local);
    return local.music_suggestions[idx];
  },

  async deleteMusicSuggestion(id) {
    if (supabase) {
      try {
        const { error } = await supabase.from("music_suggestions").delete().eq("id", id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn("Aviso ao deletar sugestão de música no Supabase, deletando local:", err.message);
      }
    }
    const local = readLocalDb();
    if (!Array.isArray(local.music_suggestions)) return false;
    const initial = local.music_suggestions.length;
    local.music_suggestions = local.music_suggestions.filter(m => m.id !== id);
    writeLocalDb(local);
    return local.music_suggestions.length < initial;
  },

  async addContent(type, item) {
    const table = collectionByType[type];
    if (!table) throw new Error("Tipo de conteúdo inválido");

    if (supabase) {
      try {
        const { error } = await supabase.from(table).insert([item]);
        if (error) throw error;
        return item;
      } catch (err) {
        console.warn(`Aviso ao adicionar conteúdo em ${table} no Supabase, gravando local:`, err.message);
      }
    }
    const local = readLocalDb();
    if (!local[table]) local[table] = [];
    local[table].push(item);
    writeLocalDb(local);
    return item;
  },

  async updateChurch(id, payload) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("churches").update(payload).eq("id", id).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn("Aviso ao atualizar igreja no Supabase, gravando local:", err.message);
      }
    }
    const local = readLocalDb();
    const idx = local.churches.findIndex(c => c.id === id);
    if (idx < 0) return null;
    local.churches[idx] = { ...local.churches[idx], ...payload };
    writeLocalDb(local);
    return local.churches[idx];
  },

  async updatePastoral(id, payload) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("pastorals").update(payload).eq("id", id).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn("Aviso ao atualizar pastoral no Supabase, gravando local:", err.message);
      }
    }
    const local = readLocalDb();
    const idx = local.pastorals.findIndex(p => p.id === id);
    if (idx < 0) return null;
    local.pastorals[idx] = { ...local.pastorals[idx], ...payload };
    writeLocalDb(local);
    return local.pastorals[idx];
  },

  async deleteContent(type, id) {
    const table = collectionByType[type];
    if (!table) throw new Error("Tipo de conteúdo inválido");

    if (supabase) {
      try {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn(`Aviso ao deletar ${table} no Supabase, deletando local:`, err.message);
      }
    }
    const local = readLocalDb();
    if (!local[table]) return false;
    const initial = local[table].length;
    local[table] = local[table].filter(item => item.id !== id);
    writeLocalDb(local);
    return local[table].length < initial;
  },

  async getAdmin(email) {
    if (supabase) {
      try {
        let query = supabase.from("admins").select("*");
        if (email) {
          query = query.ilike("email", email);
        } else {
          query = query.limit(1);
        }
        const { data, error } = await query.maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.warn("Aviso ao buscar admin no Supabase:", err.message);
      }
    }
    if (fs.existsSync(ADMIN_FILE)) {
      try {
        const local = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"));
        // Se achou local mas não no supabase, tenta sincronizar
        if (supabase && local && (!email || local.email.toLowerCase() === email.toLowerCase())) {
          supabase.from("admins").upsert([local], { onConflict: "email" }).catch(() => {});
        }
        return local;
      } catch {
        return null;
      }
    }
    return null;
  },

  async saveAdmin(adminInput, maybePasswordHash) {
    let adminRecord;
    if (typeof adminInput === "string") {
      adminRecord = {
        email: adminInput.toLowerCase(),
        passwordHash: maybePasswordHash,
        createdAt: new Date().toISOString()
      };
    } else {
      adminRecord = {
        email: adminInput.email.toLowerCase(),
        passwordHash: adminInput.passwordHash,
        recoveryHash: adminInput.recoveryHash || null,
        createdAt: adminInput.createdAt || new Date().toISOString(),
        passwordUpdatedAt: adminInput.passwordUpdatedAt || null,
        recoveryUpdatedAt: adminInput.recoveryUpdatedAt || null
      };
    }

    if (supabase) {
      try {
        await supabase.from("admins").upsert([adminRecord], { onConflict: "email" });
      } catch (err) {
        console.warn("Aviso ao salvar admin no Supabase:", err.message);
      }
    }
    try {
      fs.writeFileSync(ADMIN_FILE, JSON.stringify(adminRecord, null, 2), "utf8");
    } catch (err) {
      console.warn("Aviso ao salvar admin local:", err.message);
    }
    return adminRecord;
  },

  async updateAdminPasswordAndRecovery(email, passwordHash, recoveryHash) {
    const now = new Date().toISOString();
    const updatePayload = {
      passwordHash,
      recoveryHash,
      passwordUpdatedAt: now,
      recoveryUpdatedAt: now
    };

    if (supabase) {
      try {
        await supabase.from("admins").update(updatePayload).ilike("email", email);
      } catch (err) {
        console.warn("Aviso ao atualizar credenciais no Supabase:", err.message);
      }
    }

    try {
      if (fs.existsSync(ADMIN_FILE)) {
        const current = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"));
        fs.writeFileSync(ADMIN_FILE, JSON.stringify({
          ...current,
          ...updatePayload
        }, null, 2), "utf8");
      }
    } catch (err) {
      console.warn("Aviso ao atualizar admin local:", err.message);
    }
    return true;
  },

  async resetContent() {
    const initial = JSON.parse(fs.readFileSync(DEFAULT_DB_FILE, "utf8"));
    if (supabase) {
      try {
        for (const table of PUBLIC_TABLES) {
          const items = initial[table] || [];
          if (items.length > 0) {
            await supabase.from(table).upsert(items, { onConflict: "id" });
          }
        }
      } catch (err) {
        console.warn("Aviso ao resetar no Supabase:", err.message);
      }
    }
    const current = readLocalDb();
    initial.registrations = current.registrations || [];
    initial.contacts = current.contacts || [];
    writeLocalDb(initial);
    return true;
  }
};
