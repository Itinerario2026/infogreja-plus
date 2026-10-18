import readline from "readline";
import bcrypt from "bcryptjs";
import { db } from "./db.js";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = question => new Promise(resolve => rl.question(question, resolve));

console.log("\n=== CONFIGURAÇÃO DO ADMINISTRADOR ===");
console.log("Essas credenciais serão gravadas no banco e exigidas para acessar /admin.\n");

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

const passwordHash = await bcrypt.hash(password, 12);
await db.saveAdmin(email, passwordHash);
rl.close();
console.log("\nAdministrador configurado com sucesso no sistema e no banco!\n");
