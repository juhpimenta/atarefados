// ─────────────────────────────────────────────────────────────
// Tipos do banco de dados
// ─────────────────────────────────────────────────────────────

export type Profile = {
  id: string
  nome: string | null
  email: string | null
  avatar_url: string | null
  profissao: string | null
  tamanho: string | null
  meta_mensal: number
  moeda: string
  fuso: string
  onboarding: boolean
  created_at: string
  updated_at: string
}

export type Client = {
  id: string
  user_id: string
  nome: string
  contato: string | null
  cargo: string | null
  email: string | null
  whatsapp: string | null
  cidade: string | null
  segmento: string | null
  perfil_aprov: 'rapido' | 'socio' | 'comite'
  origem: string | null
  notas: string | null
  status: 'ativo' | 'inativo'
  created_at: string
  updated_at: string
  // computed
  _projects_count?: number
  _total_faturado?: number
}

export type Project = {
  id: string
  user_id: string
  client_id: string | null
  nome: string
  descricao: string | null
  status: 'andamento' | 'pausado' | 'concluido' | 'cancelado'
  prioridade: 'baixa' | 'normal' | 'alta'
  valor: number
  horas_est: number
  horas_real: number
  data_inicio: string | null
  data_prazo: string | null
  etapa_atual: string
  etapas: string[]
  cor: string
  // campos de estimativa inteligente
  natureza: string | null
  tipo_projeto: string | null
  complexidade: 'simples' | 'medio' | 'complexo' | null
  info_extra: string | null
  horas_est_origem: 'historico' | 'ia' | 'hibrida' | 'manual' | null
  horas_est_expl: string | null
  created_at: string
  updated_at: string
  // joined
  client?: Pick<Client, 'id' | 'nome'>
  _tasks_count?: number
  _tasks_done?: number
}

export type Task = {
  id: string
  user_id: string
  project_id: string | null
  nome: string
  descricao: string | null
  status: 'ag' | 'an' | 'co'
  prioridade: 'b' | 'n' | 'a'
  etapa: string | null
  horas_est: number
  minutos_est: number
  horas_real: number
  prazo: string | null
  ordem: number
  created_at: string
  updated_at: string
  // joined
  project?: Pick<Project, 'id' | 'nome' | 'cor'>
}

export type TimeEntry = {
  id: string
  user_id: string
  task_id: string | null
  project_id: string | null
  descricao: string | null
  segundos: number
  iniciado_em: string | null
  finalizado_em: string | null
  data: string
  created_at: string
  // joined
  task?: Pick<Task, 'id' | 'nome'>
  project?: Pick<Project, 'id' | 'nome' | 'cor'>
}

export type FinancialTransaction = {
  id: string
  user_id: string
  project_id: string | null
  client_id: string | null
  tipo: 'entrada' | 'despesa'
  subtipo: string | null
  valor: number
  forma_pag: string | null
  data: string
  descricao: string | null
  status: 'confirmado' | 'pendente' | 'cancelado'
  notas: string | null
  created_at: string
  updated_at: string
  // joined
  project?: Pick<Project, 'id' | 'nome'>
  client?: Pick<Client, 'id' | 'nome'>
}

// ─────────────────────────────────────────────────────────────
// Helpers de formatação
// ─────────────────────────────────────────────────────────────

export function fmtBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':')
}

export function fmtDate(iso: string): string {
  const [y, mo, d] = iso.split('-')
  return `${d}/${mo}/${y}`
}

export function initials(nome: string): string {
  return nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export const prioEmoji: Record<string, string> = { b: '🟢', n: '🔵', a: '🔴' }
export const prioLabel: Record<string, string> = { b: 'Baixa', n: 'Normal', a: 'Alta' }
export const statusLabel: Record<string, string> = {
  ag: 'Aguardando', an: 'Em andamento', co: 'Concluída',
  andamento: 'Em andamento', pausado: 'Pausado', concluido: 'Concluído', cancelado: 'Cancelado',
}
export const formaPagLabel: Record<string, string> = {
  pix: 'PIX', ted: 'TED', cartao: 'Cartão', dinheiro: 'Dinheiro', boleto: 'Boleto',
}
