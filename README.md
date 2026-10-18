# InfoGreja+ — React + Node.js + Supabase

Portal digital para as 12 igrejas e suas pastorais, com área pública, páginas específicas por pastoral e administração protegida por login.

---

## 🚀 Conexão com o Supabase

Projeto Supabase configurado: **`https://wxjzewhqbbvvarotpeyg.supabase.co`**

### 1. Criar as Tabelas no Supabase (SQL Editor)
1. Acesse o painel do seu projeto Supabase:  
   👉 [https://supabase.com/dashboard/project/wxjzewhqbbvvarotpeyg/sql](https://supabase.com/dashboard/project/wxjzewhqbbvvarotpeyg/sql)
2. Abra o arquivo [`supabase/schema.sql`](supabase/schema.sql), copie todo o conteúdo e cole no SQL Editor do Supabase.
3. Clique em **Run** para criar todas as 11 tabelas com Row Level Security (RLS) e políticas configuradas.

### 2. Popular os Dados Iniciais (12 Igrejas + 156 Pastorais)
Você tem duas formas fáceis de popular o banco:

- **Opção A (Pelo SQL Editor - Recomendado):**  
  Copie o conteúdo de [`supabase/seed.sql`](supabase/seed.sql) e execute no SQL Editor do Supabase. Ele cadastra todas as 12 igrejas, 156 pastorais e programações iniciais.

- **Opção B (Pelo script automatizado Node):**  
  Configure o arquivo `.env` com suas chaves e rode:
  ```bash
  npm run db:migrate
  ```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (baseado em `.env.example`):
```env
SUPABASE_URL=https://wxjzewhqbbvvarotpeyg.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_do_painel_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_do_painel_supabase
SESSION_SECRET=infogreja_super_secret_session_2026
PORT=3001
```
> As chaves `anon` e `service_role` ficam em **Project Settings > API** no Supabase.

---

## 🌐 Deploy na Vercel

O projeto já está estruturado com `vercel.json` e funções serverless em `api/index.js`.

### Opção 1: Conectar pelo GitHub (Mais Fácil)
1. Faça o push do repositório para o seu GitHub (veja a seção abaixo).
2. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**.
3. Importe o repositório do GitHub.
4. Na tela de configuração de ambiente (**Environment Variables**), adicione:
   - `SUPABASE_URL` = `https://wxjzewhqbbvvarotpeyg.supabase.co`
   - `SUPABASE_ANON_KEY` = `(sua anon key)`
   - `SUPABASE_SERVICE_ROLE_KEY` = `(sua service_role key)`
   - `SESSION_SECRET` = `(uma chave secreta qualquer)`
5. Clique em **Deploy**! A Vercel construirá o React e publicará a API automaticamente.

### Opção 2: Deploy pelo Terminal (Vercel CLI)
```bash
cmd.exe /c "vercel login"
cmd.exe /c "vercel --prod"
```

---

## 📦 Como Subir no GitHub

1. Crie um novo repositório vazio no GitHub (ex: `infogreja-plus`).
2. No terminal da pasta do projeto, rode:
```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

---

## 💻 Como Iniciar Localmente (Windows)

1. Execute `INICIAR_SITE.bat` ou pelo terminal:
   ```bash
   npm run dev
   ```
2. Acesse:
   - Site: `http://localhost:5173`
   - Painel Admin: `http://localhost:5173/admin`
