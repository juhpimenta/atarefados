-- ─────────────────────────────────────────────────────────────
-- ATAREFADOS 2026 — Schema Inicial
-- Execute no Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PERFIS DE USUÁRIO ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome          TEXT,
  email         TEXT,
  avatar_url    TEXT,
  profissao     TEXT,           -- designer, dev, redator, etc
  tamanho       TEXT,           -- solo, pequena, media
  meta_mensal   NUMERIC(12,2) DEFAULT 0,
  moeda         TEXT DEFAULT 'BRL',
  fuso          TEXT DEFAULT 'America/Sao_Paulo',
  onboarding    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── CLIENTES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  contato       TEXT,
  cargo         TEXT,
  email         TEXT,
  whatsapp      TEXT,
  cidade        TEXT,
  segmento      TEXT,
  perfil_aprov  TEXT DEFAULT 'rapido',   -- rapido | socio | comite
  origem        TEXT,
  notas         TEXT,
  status        TEXT DEFAULT 'ativo',    -- ativo | inativo
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROJETOS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
  nome          TEXT NOT NULL,
  descricao     TEXT,
  status        TEXT DEFAULT 'andamento', -- andamento | pausado | concluido | cancelado
  prioridade    TEXT DEFAULT 'normal',    -- baixa | normal | alta
  valor         NUMERIC(12,2) DEFAULT 0,
  horas_est     NUMERIC(8,2)  DEFAULT 0,
  horas_real    NUMERIC(8,2)  DEFAULT 0,
  data_inicio   DATE,
  data_prazo    DATE,
  etapa_atual   TEXT DEFAULT 'briefing',
  etapas        JSONB DEFAULT '["Briefing","Criação","Revisão","Aprovação","Entrega"]'::jsonb,
  cor           TEXT DEFAULT '#5413A0',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── TAREFAS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES projects(id) ON DELETE SET NULL,
  nome          TEXT NOT NULL,
  descricao     TEXT,
  status        TEXT DEFAULT 'ag',    -- ag | an | co (aguardando | andamento | concluída)
  prioridade    TEXT DEFAULT 'n',     -- b | n | a (baixa | normal | alta)
  etapa         TEXT,
  horas_est     NUMERIC(8,2) DEFAULT 0,
  minutos_est   INTEGER DEFAULT 0,
  horas_real    NUMERIC(8,2) DEFAULT 0,
  prazo         DATE,
  ordem         INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── ENTRADAS DE TEMPO ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_entries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id       UUID REFERENCES tasks(id) ON DELETE SET NULL,
  project_id    UUID REFERENCES projects(id) ON DELETE SET NULL,
  descricao     TEXT,
  segundos      INTEGER NOT NULL DEFAULT 0,
  iniciado_em   TIMESTAMPTZ,
  finalizado_em TIMESTAMPTZ,
  data          DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── TRANSAÇÕES FINANCEIRAS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
  tipo          TEXT NOT NULL,    -- entrada | despesa
  subtipo       TEXT,             -- entrada: sinal|saldo|parcela|avulso / despesa: software|hardware|etc
  valor         NUMERIC(12,2) NOT NULL,
  forma_pag     TEXT,             -- pix | ted | cartao | dinheiro | boleto
  data          DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao     TEXT,
  status        TEXT DEFAULT 'confirmado',  -- confirmado | pendente | cancelado
  notas         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_user        ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user       ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client     ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user          ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project       ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user   ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_proj   ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_fin_user            ON financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fin_proj            ON financial_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_fin_data            ON financial_transactions(data);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients                ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Clients
CREATE POLICY "clients_own" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- Projects
CREATE POLICY "projects_own" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "tasks_own" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Time entries
CREATE POLICY "time_entries_own" ON time_entries
  FOR ALL USING (auth.uid() = user_id);

-- Financial
CREATE POLICY "financial_own" ON financial_transactions
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: criar perfil ao registrar usuário
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: atualizar updated_at automaticamente
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_financial
  BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
