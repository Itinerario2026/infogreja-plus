import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, ".env") });

const connectionString = process.env.DATABASE_URL;

async function setup() {
  console.log("Conectando ao banco de dados Supabase via PostgreSQL...");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Conectado com sucesso ao Supabase PostgreSQL!");

    console.log("Executando schema.sql (Criando tabelas e politicas RLS)...");
    const schemaSql = fs.readFileSync(path.join(ROOT, "supabase", "schema.sql"), "utf8");
    await client.query(schemaSql);
    console.log("Tabelas e RLS criados com sucesso!");

    console.log("Executando seed.sql (Inserindo 12 igrejas, 156 pastorais e dados iniciais)...");
    const seedSql = fs.readFileSync(path.join(ROOT, "supabase", "seed.sql"), "utf8");
    await client.query(seedSql);
    console.log("Dados inseridos com sucesso no Supabase!");

    // Verificar dados
    const resChurches = await client.query('SELECT count(*) FROM public.churches;');
    const resPastorals = await client.query('SELECT count(*) FROM public.pastorals;');
    console.log(`Verificação: ${resChurches.rows[0].count} igrejas e ${resPastorals.rows[0].count} pastorais no banco.`);
  } catch (err) {
    console.error("Erro durante a configuracao do banco:", err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    await client.end();
  }
}

setup();
