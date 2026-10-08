@AGENTS.md

# Phronix AI

PWA que transforma currículo + vaga em um roteiro de entrevista curto, ensaiado e consultável ao vivo. Produto em português do Brasil.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind 4 · Serwist (service worker) · Dexie (IndexedDB) · Supabase (Auth, Postgres com RLS) · API do Claude · Zod.

## Regras do projeto

- **Verdade antes de brilho.** A IA nunca inventa empresa, cargo, projeto, tecnologia ou número. Dado ausente vira `[confirmar: …]`, e cada resposta aponta para um case com origem.
- **IA só no servidor.** Use `src/lib/ai/client.ts` (`anthropic`, `MODELS`). Sonnet 5.5 onde o usuário lê o resultado, Haiku 4.5 em extração, reescrita e validação.
- **Hora do Show é offline.** `src/app/hora-do-show` lê só do Dexie (`src/lib/local-db.ts`), sem chamadas de rede. Fundo `bg-palco` (#000), transições de no máximo 120 ms.
- **Conta primeiro, depois o painel.** Fluxo: `/criar-conta` → onboarding `/comecar` (só o currículo) → `/painel`, onde a pessoa cadastra vagas (`/painel/nova-vaga`: vaga → diagnóstico → escolher o kit). As rotas protegidas estão em `isProtected` (`src/lib/supabase/proxy.ts`); landing, Hora do Show e `/kits/demo/...` ficam abertas.
- **Tipos do domínio** ficam em `src/lib/domain.ts`, com nomes de campo iguais às colunas do Postgres.
- **Design.** Nenhuma tela é desenhada fora da `/sites-incriveis`. Cores só pelos tokens da paleta Brasa (`bg-noite`, `text-osso`, `text-fenix`…, definidos em `src/app/globals.css`). Botão primário: fundo Fênix com texto Noite.
- Cache Components está desligado, porque o route handler do Serwist não é compatível com ele.
- **Banco.** O schema fica em `supabase/migrations/`. Toda tabela nova precisa de RLS. Colunas de cobrança e custo (`profiles.plano`, `kits.acesso*`, `qa_items.bloqueado`, `ai_usage`, `subscriptions`) só são escritas com `createAdminClient()` (`src/lib/supabase/admin.ts`).
