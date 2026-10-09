@AGENTS.md

# Phronix AI

PWA que transforma currículo + vaga em um roteiro de entrevista curto, ensaiado e consultável ao vivo. Produto em português do Brasil.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind 4 · Serwist (service worker) · Dexie (IndexedDB) · Supabase (Auth, Postgres com RLS) · API do Gemini (`@google/genai`) · Zod.

## Regras do projeto

- **Verdade antes de brilho.** A IA nunca inventa empresa, cargo, projeto, tecnologia ou número. Dado ausente vira `[confirmar: …]`, e cada resposta aponta para um case com origem.
- **IA só no servidor.** Use `src/lib/ai/client.ts` (`gemini`, `MODELS`) e `gerarJson` (`src/lib/ai/estruturado.ts`) para saída com esquema Zod. Gemini 3.8 Flash onde o usuário lê o resultado, 3.5 Flash-Lite em extração, reescrita e validação. Chave em `GEMINI_API_KEY`.
- **Hora do Show é offline.** `src/app/hora-do-show` lê do Dexie (`src/lib/local-db.ts`); a rede só entra para baixar kits antes de entrar no palco, com limite de tempo. Fundo `bg-palco` (#000), transições de no máximo 120 ms.
- **Fluxo (PRD em `docs/PRD.md`).** Landing → `/criar-conta` ou `/entrar` (só a conta, sem currículo) → `/painel`. Do painel: `/elaborar` (currículo, se faltar → vaga → diagnóstico → entrevista → conversa → mapa), `/pratica` (escolher a entrevista) e `/hora-do-show` (escolher a entrevista). O currículo só é lido dentro do app, logado (`/curriculo` ou o primeiro passo do Elaborar). As rotas protegidas estão em `isProtected` (`src/lib/supabase/proxy.ts`); landing, Hora do Show e `/kits/demo/...` ficam abertas.
- **Tipos do domínio** ficam em `src/lib/domain.ts`, com nomes de campo iguais às colunas do Postgres.
- **Design.** Nenhuma tela é desenhada fora da `/sites-incriveis`. Cores só pelos tokens da paleta Brasa (`bg-noite`, `text-osso`, `text-fenix`…, definidos em `src/app/globals.css`). Botão primário: fundo Fênix com texto Noite.
- Cache Components está desligado, porque o route handler do Serwist não é compatível com ele.
- **Banco.** O schema fica em `supabase/migrations/`. Toda tabela nova precisa de RLS. Colunas de cobrança e custo (`profiles.plano`, `kits.acesso*`, `qa_items.bloqueado`, `ai_usage`, `subscriptions`) só são escritas com `createAdminClient()` (`src/lib/supabase/admin.ts`).
