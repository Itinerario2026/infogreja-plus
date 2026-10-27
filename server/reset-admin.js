import fs from "fs";
import path from "path";
import readline from "readline";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_FILE = path.join(__dirname, "data", "admin.json");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(resolve => rl.question(q, resolve));
const makeRecoveryCode = () => {
  const raw = crypto.randomBytes(12).toString("hex").toUpperCase();
  return `MP-${raw.slice(0,4)}-${raw.slice(4,8)}-${raw.slice(8,12)}-${raw.slice(12,16)}-${raw.slice(16,20)}-${raw.slice(20,24)}`;
};

console.log("\n=== MINHA PARÓQUIA • REDEFINIÇÃO LOCAL DO ADMIN ===\n");
let current = null;
if (fs.existsSync(ADMIN_FILE)) current = JSON.parse(fs.readFileSync(ADMIN_FILE,"utf8"));

const currentEmail = current?.email || "";
let email = (await ask(`E-mail do administrador${currentEmail ? ` [${currentEmail}]` : ""}: `)).trim().toLowerCase();
if (!email) email = currentEmail;
while (!email || !email.includes("@")) email = (await ask("Digite um e-mail válido: ")).trim().toLowerCase();

let password = await ask("Nova senha (mínimo 8 caracteres): ");
while (password.length < 8) password = await ask("A senha precisa ter pelo menos 8 caracteres. Digite novamente: ");
const confirm = await ask("Confirme a nova senha: ");
if (confirm !== password) {
  console.error("\nAs senhas não coincidem. Nenhuma alteração foi feita.\n");
  rl.close();
  process.exit(1);
}

const recoveryCode = makeRecoveryCode();
const [passwordHash,recoveryHash] = await Promise.all([bcrypt.hash(password,12),bcrypt.hash(recoveryCode,12)]);
fs.writeFileSync(ADMIN_FILE, JSON.stringify({
  email,
  passwordHash,
  recoveryHash,
  createdAt: current?.createdAt || new Date().toISOString(),
  passwordUpdatedAt: new Date().toISOString(),
  recoveryUpdatedAt: new Date().toISOString()
}, null, 2));

try {
  const { db } = await import("./db.js");
  await db.updateAdminPasswordAndRecovery(email, passwordHash, recoveryHash);
  console.log("Credenciais sincronizadas com o banco Supabase com sucesso.");
} catch (err) {
  // Ignora se não houver conexão externa
}

rl.close();
console.log("\nSenha redefinida com sucesso.");
console.log("\nNOVA CHAVE DE RECUPERAÇÃO (guarde em local seguro):");
console.log(recoveryCode);
console.log("\nA chave não fica salva em texto puro.\n");
