-- Migração: adicionar campos de estimativa inteligente em projects
-- Execute no painel SQL do Supabase

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS natureza        text,
  ADD COLUMN IF NOT EXISTS tipo_projeto    text,
  ADD COLUMN IF NOT EXISTS complexidade    text CHECK (complexidade IN ('simples', 'medio', 'complexo')),
  ADD COLUMN IF NOT EXISTS info_extra      text,
  ADD COLUMN IF NOT EXISTS horas_est_origem text CHECK (horas_est_origem IN ('historico', 'ia', 'hibrida', 'manual')),
  ADD COLUMN IF NOT EXISTS horas_est_expl  text,
  ADD COLUMN IF NOT EXISTS status          text NOT NULL DEFAULT 'andamento'
    CHECK (status IN ('andamento', 'pausado', 'concluido', 'cancelado'));

-- Garante que projetos existentes sem status fiquem em 'andamento'
UPDATE projects SET status = 'andamento' WHERE status IS NULL;
