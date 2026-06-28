-- ─────────────────────────────────────────────────────────────
-- ATAREFADOS 2026 — Migration 002
-- Adiciona valor_hora e tipos_tarefa ao profiles
-- Execute no Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS valor_hora    NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tipos_tarefa  JSONB DEFAULT '["Design","Desenvolvimento","Redação","Revisão","Reunião","Pesquisa"]'::jsonb;
