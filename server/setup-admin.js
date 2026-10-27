import fs from "fs";
import path from "path";
import readline from "readline";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_FILE = path.join(__dirname, "data", "admin.json");

if (fs.existsSync(ADMIN_FILE)) {
  console.log("\nAdministrador já configurado.\n");
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = question => new Promise(resolve => rl.question(question, resolve));
const makeRecoveryCode = () => {
  const raw = crypto.randomBytes(12).toString("hex").toUpperCase();
  return `MP-${raw.slice(0,4)}-${raw.slice(4,8)}-${raw.slice(8,12)}-${raw.slice(12,16)}-${raw.slice(16,20)}-${raw.slice(20,24)}`;
};

console.log("\n=== MINHA PARÓQUIA • CONFIGURAÇÃO DO ADMINISTRADOR ===");
console.log("Essas credenciais serão exigidas para acessar /admin.\n");

let email = (await ask("E-mail do administrador: ")).trim().toLowerCase();
while (!email || !email.includes("@")) {
  email = (await ask("Digite um e-mail válido: ")).trim().toLowerCase();
}

let password = await ask("Senha (mínimo 8 caracteres): ");
while (password.length < 8) {
  password = await ask("A senha precisa ter pelo menos 8 caracteres. Digite novamente: ");
}

const confirm = await ask("Confirme a senha: ");
if (confirm !== password) {
  console.error("\nAs senhas não coincidem. Execute novamente o inicializador.\n");
  rl.close();
  process.exit(1);
}

const recoveryCode = makeRecoveryCode();
const [passwordHash, recoveryHash] = await Promise.all([
  bcrypt.hash(password, 12),
  bcrypt.hash(recoveryCode, 12)
]);

fs.writeFileSync(ADMIN_FILE, JSON.stringify({
  email,
  passwordHash,
  recoveryHash,
  createdAt: new Date().toISOString(),
  recoveryUpdatedAt: new Date().toISOString()
}, null, 2));

try {
  const { db } = await import("./db.js");
  await db.saveAdmin({
    email,
    passwordHash,
    recoveryHash,
    createdAt: new Date().toISOString(),
    recoveryUpdatedAt: new Date().toISOString()
  });
  console.log("Credenciais sincronizadas com o banco Supabase com sucesso.");
} catch (err) {
  // Ignora se não houver conexão externa
}

rl.close();
console.log("\nAdministrador criado com sucesso.");
console.log("\n====================================================");
console.log("CHAVE DE RECUPERAÇÃO — GUARDE EM LOCAL SEGURO");
console.log("====================================================");
console.log(recoveryCode);
console.log("====================================================");
console.log("A chave acima NÃO fica salva em texto puro no sistema.");
console.log("Ela será necessária para recuperar a senha pelo site.\n");
