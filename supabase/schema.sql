-- ==============================================================================
-- Schema InfoGreja+ para Supabase (PostgreSQL)
-- Projeto: https://wxjzewhqbbvvarotpeyg.supabase.co
-- ==============================================================================

-- 1. Igrejas (Churches)
CREATE TABLE IF NOT EXISTS public.churches (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "description" TEXT,
  "location" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "whatsapp" TEXT,
  "pastor" TEXT,
  "map" TEXT,
  "image" TEXT,
  "instagram" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pastorais (Pastorals)
CREATE TABLE IF NOT EXISTS public.pastorals (
  "id" TEXT PRIMARY KEY,
  "churchId" TEXT NOT NULL REFERENCES public.churches("id") ON DELETE CASCADE,
  "slug" TEXT,
  "title" TEXT NOT NULL,
  "icon" TEXT,
  "description" TEXT,
  "coordinator" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "email" TEXT,
  "meetingDay" TEXT,
  "meetingTime" TEXT,
  "location" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Eventos (Events)
CREATE TABLE IF NOT EXISTS public.events (
  "id" TEXT PRIMARY KEY,
  "churchId" TEXT NOT NULL REFERENCES public.churches("id") ON DELETE CASCADE,
  "pastoralId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TEXT,
  "time" TEXT,
  "location" TEXT,
  "category" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Atividades (Activities)
CREATE TABLE IF NOT EXISTS public.activities (
  "id" TEXT PRIMARY KEY,
  "churchId" TEXT NOT NULL REFERENCES public.churches("id") ON DELETE CASCADE,
  "pastoralId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TEXT,
  "time" TEXT,
  "location" TEXT,
  "category" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Avisos (Notices)
CREATE TABLE IF NOT EXISTS public.notices (
  "id" TEXT PRIMARY KEY,
  "churchId" TEXT NOT NULL REFERENCES public.churches("id") ON DELETE CASCADE,
  "pastoralId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TEXT,
  "time" TEXT,
  "location" TEXT,
  "category" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Grupos (Groups)
CREATE TABLE IF NOT EXISTS public.groups (
  "id" TEXT PRIMARY KEY,
  "churchId" TEXT NOT NULL REFERENCES public.churches("id") ON DELETE CASCADE,
  "pastoralId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TEXT,
  "time" TEXT,
  "whatsapp" TEXT,
  "location" TEXT,
  "category" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Horários (Schedules)
CREATE TABLE IF NOT EXISTS public.schedules (
  "id" TEXT PRIMARY KEY,
  "churchId" TEXT NOT NULL REFERENCES public.churches("id") ON DELETE CASCADE,
  "pastoralId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TEXT,
  "time" TEXT,
  "location" TEXT,
  "category" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Programações (Programs)
CREATE TABLE IF NOT EXISTS public.programs (
  "id" TEXT PRIMARY KEY,
  "churchId" TEXT NOT NULL REFERENCES public.churches("id") ON DELETE CASCADE,
  "pastoralId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TEXT,
  "time" TEXT,
  "location" TEXT,
  "category" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Inscrições (Registrations)
CREATE TABLE IF NOT EXISTS public.registrations (
  "id" TEXT PRIMARY KEY,
  "churchId" TEXT NOT NULL REFERENCES public.churches("id") ON DELETE CASCADE,
  "pastoralId" TEXT,
  "item" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Mensagens de Contato (Contacts)
CREATE TABLE IF NOT EXISTS public.contacts (
  "id" TEXT PRIMARY KEY,
  "churchId" TEXT NOT NULL REFERENCES public.churches("id") ON DELETE CASCADE,
  "pastoralId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Usuários Administradores (Admins)
CREATE TABLE IF NOT EXISTS public.admins (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastorals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público (Leitura para todos nos dados da comunidade)
DROP POLICY IF EXISTS "Public Read Churches" ON public.churches;
CREATE POLICY "Public Read Churches" ON public.churches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Pastorals" ON public.pastorals;
CREATE POLICY "Public Read Pastorals" ON public.pastorals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Events" ON public.events;
CREATE POLICY "Public Read Events" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Activities" ON public.activities;
CREATE POLICY "Public Read Activities" ON public.activities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Notices" ON public.notices;
CREATE POLICY "Public Read Notices" ON public.notices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Groups" ON public.groups;
CREATE POLICY "Public Read Groups" ON public.groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Schedules" ON public.schedules;
CREATE POLICY "Public Read Schedules" ON public.schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Programs" ON public.programs;
CREATE POLICY "Public Read Programs" ON public.programs FOR SELECT USING (true);

-- Permissão pública para envio de inscrições e contatos
DROP POLICY IF EXISTS "Public Insert Registrations" ON public.registrations;
CREATE POLICY "Public Insert Registrations" ON public.registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Contacts" ON public.contacts;
CREATE POLICY "Public Insert Contacts" ON public.contacts FOR INSERT WITH CHECK (true);

-- Políticas para Service Role / Admin (acesso completo)
DROP POLICY IF EXISTS "Service Role All Churches" ON public.churches;
CREATE POLICY "Service Role All Churches" ON public.churches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Pastorals" ON public.pastorals;
CREATE POLICY "Service Role All Pastorals" ON public.pastorals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Events" ON public.events;
CREATE POLICY "Service Role All Events" ON public.events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Activities" ON public.activities;
CREATE POLICY "Service Role All Activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Notices" ON public.notices;
CREATE POLICY "Service Role All Notices" ON public.notices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Groups" ON public.groups;
CREATE POLICY "Service Role All Groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Schedules" ON public.schedules;
CREATE POLICY "Service Role All Schedules" ON public.schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Programs" ON public.programs;
CREATE POLICY "Service Role All Programs" ON public.programs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Registrations" ON public.registrations;
CREATE POLICY "Service Role All Registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Contacts" ON public.contacts;
CREATE POLICY "Service Role All Contacts" ON public.contacts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Admins" ON public.admins;
CREATE POLICY "Service Role All Admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);
