# ⚡ Atarefados 2026

Plataforma de gestão para freelancers e agências — **Next.js 14 + Supabase + Vercel**.

---

## 🚀 Setup em 5 passos

### 1. Clonar / extrair o projeto

```bash
cd atarefados
npm install
```

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → **New Project**
2. Anote a **URL** e a **anon key** (em Project Settings → API)
3. No **SQL Editor**, cole e execute o arquivo `supabase/migrations/001_initial.sql`

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 4. Rodar localmente

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### 5. Deploy na Vercel

1. Faça push para GitHub
2. Acesse [vercel.com](https://vercel.com) → **Import Project**
3. Adicione as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy!**

---

## 📁 Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Tela de login
│   │   └── signup/         # Tela de cadastro
│   ├── (dashboard)/
│   │   ├── layout.tsx      # Layout com sidebar
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── tasks/          # Tarefas + Timer
│   │   ├── projects/       # Lista de projetos
│   │   │   └── [id]/       # Detalhe do projeto
│   │   ├── clients/        # Clientes (CRM)
│   │   ├── financial/      # Financeiro
│   │   ├── insights/       # Analytics
│   │   └── settings/       # Configurações
│   ├── onboarding/         # Onboarding pós-cadastro
│   └── page.tsx            # Landing page
├── components/
│   └── layout/
│       ├── Sidebar.tsx
│       └── MobileTopbar.tsx
├── lib/
│   ├── supabase.ts         # Client-side Supabase
│   ├── supabase-server.ts  # Server-side Supabase
│   └── types.ts            # Tipos TypeScript + helpers
├── middleware.ts            # Proteção de rotas
└── styles/
    └── globals.css         # Design system completo
supabase/
└── migrations/
    └── 001_initial.sql     # Schema completo do banco
```

---

## 🗄️ Banco de dados

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfil do usuário (nome, meta, profissão) |
| `clients` | Clientes com perfil de aprovação e segmento |
| `projects` | Projetos com etapas, valor e prazo |
| `tasks` | Tarefas com prioridade e estimativa |
| `time_entries` | Registros do timer (segundos) |
| `financial_transactions` | Entradas e despesas |

**RLS habilitado** — cada usuário só acessa seus próprios dados.

---

## ✅ Funcionalidades implementadas

- [x] Landing page
- [x] Cadastro e login com Supabase Auth
- [x] Onboarding (profissão, tamanho, meta)
- [x] Dashboard com métricas reais
- [x] Tarefas: criar, concluir, filtrar, excluir
- [x] Timer por tarefa com salvamento automático
- [x] Projetos: criar, etapas, progresso, avançar etapa
- [x] Detalhe do projeto: tarefas, tempo, financeiro
- [x] Clientes: modal 3 passos, perfil de aprovação, busca
- [x] Financeiro: recebimentos e despesas com modal
- [x] Insights: taxa de conclusão, receita, rentabilidade
- [x] Configurações: perfil, senha, meta mensal
- [x] Sidebar responsiva (mobile + desktop)
- [x] RLS no Supabase (dados isolados por usuário)
- [x] Middleware de proteção de rotas

---

## 🛠️ Stack

- **Next.js 14** — App Router, Server Components
- **Supabase** — Auth, PostgreSQL, RLS
- **TypeScript** — tipagem completa
- **Vercel** — deploy e CDN

---

## 📞 Suporte

Dúvidas? Abra uma issue ou entre em contato.
