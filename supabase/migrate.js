import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load .env
dotenv.config({ path: path.join(ROOT, ".env") });
dotenv.config({ path: path.join(ROOT, "server", ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wxjzewhqbbvvarotpeyg.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error("ERRO: Nenhuma chave do Supabase fornecida.");
  console.error("Defina SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY no seu arquivo .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

const dbPath = path.join(ROOT, "server", "data", "database.json");
const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));

const tables = [
  "churches",
  "pastorals",
  "events",
  "activities",
  "notices",
  "groups",
  "schedules",
  "programs"
];

async function run() {
  console.log(`Conectando ao Supabase: ${SUPABASE_URL}`);
  
  for (const table of tables) {
    const items = data[table] || [];
    if (items.length === 0) continue;
    
    console.log(`Migrando ${items.length} itens para a tabela '${table}'...`);
    // Envia em lotes de 50 para evitar limites de payload
    const chunkSize = 50;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const { error } = await supabase.from(table).upsert(chunk, { onConflict: "id" });
      if (error) {
        console.error(`Erro ao inserir na tabela ${table}:`, error.message);
      }
    }
  }

  // Migrar admin se existir
  const adminFile = path.join(ROOT, "server", "data", "admin.json");
  if (fs.existsSync(adminFile)) {
    try {
      const admin = JSON.parse(fs.readFileSync(adminFile, "utf8"));
      const { error } = await supabase.from("admins").upsert([admin], { onConflict: "email" });
      if (error) {
        console.warn("Aviso ao sincronizar admin:", error.message);
      } else {
        console.log("Admin sincronizado no Supabase.");
      }
    } catch (e) {
      console.warn("Aviso:", e.message);
    }
  }

  console.log("Migração concluída com sucesso!");
}

run().catch(console.error);
