import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export type EstimateRequest = {
  natureza: string
  tipo_projeto: string
  complexidade: 'simples' | 'medio' | 'complexo'
  info_extra?: string
  tem_prazo?: boolean
}

export type EstimateResult = {
  horas: number
  origem: 'historico' | 'ia' | 'hibrida'
  explicacao: string
  projetos_similares?: number
  media_historico?: number
}

const COMPLEXIDADE_MULT = { simples: 0.7, medio: 1.0, complexo: 1.4 }

// Referências de mercado por tipo de projeto (em horas)
const REFERENCIAS_MERCADO: Record<string, number> = {
  'landing page': 20,
  'site institucional': 60,
  'e-commerce': 120,
  'identidade visual': 30,
  'aplicativo mobile': 200,
  'dashboard': 80,
  'pesquisa ux': 40,
  'apresentação': 15,
  'motion design': 25,
  'campanha social media': 20,
  'email marketing': 10,
  'infográfico': 12,
  'artigo / copy': 8,
  'vídeo': 30,
}

async function buscarHistoricoSimilar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  natureza: string,
  tipoProj: string,
) {
  const { data } = await supabase
    .from('projects')
    .select('nome, natureza, tipo_projeto, complexidade, horas_est, horas_real')
    .eq('user_id', userId)
    .eq('status', 'concluido')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data || data.length === 0) return null

  const similares = data.filter(p => {
    const nat = (p.natureza || '').toLowerCase()
    const tipo = (p.tipo_projeto || p.nome || '').toLowerCase()
    return (
      nat.includes(natureza.toLowerCase().slice(0, 4)) ||
      tipo.includes(tipoProj.toLowerCase().slice(0, 6))
    )
  })

  if (similares.length < 2) return null

  // Média ponderada: mais peso para projetos recentes
  const total = similares.reduce((acc, p, i) => {
    const peso = similares.length - i
    const horas = p.horas_real > 0 ? p.horas_real : p.horas_est
    return acc + horas * peso
  }, 0)
  const totalPeso = similares.reduce((acc, _, i) => acc + (similares.length - i), 0)

  return {
    media: total / totalPeso,
    quantidade: similares.length,
  }
}

async function estimarViaIA(
  natureza: string,
  tipoProj: string,
  complexidade: string,
  infoExtra: string,
  mediaHistorico: number | null,
): Promise<{ horas: number; explicacao: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Fallback sem IA: usar tabela de referências
    const chave = Object.keys(REFERENCIAS_MERCADO).find(k =>
      tipoProj.toLowerCase().includes(k) || natureza.toLowerCase().includes(k)
    )
    const base = chave ? REFERENCIAS_MERCADO[chave] : 30
    const mult = COMPLEXIDADE_MULT[complexidade as keyof typeof COMPLEXIDADE_MULT] ?? 1
    return {
      horas: Math.round(base * mult),
      explicacao: `Estimativa baseada em referências de mercado para "${tipoProj}" (${complexidade}).`,
    }
  }

  const contextoHistorico = mediaHistorico
    ? `O próprio usuário tem uma média de ${mediaHistorico.toFixed(0)} horas em projetos similares.`
    : 'Não há histórico do usuário para esse tipo de projeto.'

  const prompt = `Você é um assistente especializado em estimativa de horas para projetos criativos e de tecnologia.

Dados do projeto:
- Natureza: ${natureza}
- Tipo: ${tipoProj}
- Complexidade: ${complexidade}
- Info adicional: ${infoExtra || 'nenhuma'}
- ${contextoHistorico}

Responda SOMENTE com JSON neste formato exato (sem markdown, sem explicação extra):
{"horas": <número inteiro>, "justificativa": "<frase curta de 1 linha explicando a estimativa>"}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const mult = COMPLEXIDADE_MULT[complexidade as keyof typeof COMPLEXIDADE_MULT] ?? 1
    return { horas: Math.round(30 * mult), explicacao: 'Estimativa de referência (IA indisponível).' }
  }

  const json = await response.json()
  const text = json.content?.[0]?.text ?? ''

  try {
    const parsed = JSON.parse(text)
    return { horas: parsed.horas, explicacao: parsed.justificativa }
  } catch {
    const mult = COMPLEXIDADE_MULT[complexidade as keyof typeof COMPLEXIDADE_MULT] ?? 1
    return { horas: Math.round(30 * mult), explicacao: 'Estimativa de referência.' }
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body: EstimateRequest = await req.json()
  const { natureza, tipo_projeto, complexidade, info_extra = '' } = body

  // 1. Buscar histórico similar do usuário
  const historico = await buscarHistoricoSimilar(supabase, user.id, natureza, tipo_projeto)

  // 2. Gerar estimativa via IA (passa contexto histórico se disponível)
  const ia = await estimarViaIA(
    natureza,
    tipo_projeto,
    complexidade,
    info_extra,
    historico?.media ?? null,
  )

  // 3. Combinar resultado
  let horas: number
  let origem: EstimateResult['origem']
  let explicacao: string

  if (historico && historico.quantidade >= 3) {
    // Histórico robusto: blend 70% histórico + 30% IA
    horas = Math.round(historico.media * 0.7 + ia.horas * 0.3)
    origem = 'hibrida'
    explicacao =
      `Baseada em ${historico.quantidade} projetos similares seus (média ${historico.media.toFixed(0)}h) ` +
      `+ ajuste de complexidade por IA (${ia.horas}h sugeridas). ${ia.explicacao}`
  } else if (historico && historico.quantidade >= 1) {
    // Histórico pequeno: blend 40% histórico + 60% IA
    horas = Math.round(historico.media * 0.4 + ia.horas * 0.6)
    origem = 'hibrida'
    explicacao =
      `${historico.quantidade} projeto(s) similar(es) encontrado(s) (média ${historico.media.toFixed(0)}h). ` +
      `Estimativa complementada com IA. ${ia.explicacao}`
  } else {
    // Sem histórico: usar somente IA
    horas = ia.horas
    origem = 'ia'
    explicacao = `Sem projetos similares no seu histórico. ${ia.explicacao}`
  }

  const result: EstimateResult = {
    horas,
    origem,
    explicacao,
    projetos_similares: historico?.quantidade,
    media_historico: historico?.media,
  }

  return NextResponse.json(result)
}
