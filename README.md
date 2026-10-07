# Phronix AI

Seu roteiro de entrevista: currículo + vaga viram respostas curtas, ensaiadas e consultáveis ao vivo na Hora do Show.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha Supabase e ANTHROPIC_API_KEY
npm run dev
```

Sem as variáveis do Supabase, o `dev` sobe sem autenticação; o build de produção exige as variáveis.

O service worker só é registrado em produção (`npm run build && npm start`).

## Supabase

Projeto `phronix-ai` (ref `kigjehgqdkmwvyxwyaip`, região sa-east-1). O schema está em `supabase/migrations/`, com as mesmas versões aplicadas no projeto.

- Depois de cada migration, regenere `src/lib/supabase/database.types.ts`.
- No painel, em Authentication → URL Configuration, o Site URL e as Redirect URLs precisam incluir o endereço do app (ex.: `http://localhost:3000/**`), para o link de confirmação de e-mail voltar para `/auth/callback`.
- `SUPABASE_SECRET_KEY` vem de Project Settings → API Keys e fica só no `.env.local`.

## Estrutura

```
src/
  app/
    (site)/             landing
    (auth)/entrar/      cadastro (e-mail e senha)
    (app)/              preparações, wizard, kits (conversa, mapa, prática), conta
    hora-do-show/       tela ao vivo, offline, fundo #000
    serwist/            serve o service worker (sw.ts)
    manifest.ts         manifest do PWA
  lib/
    ai/client.ts        cliente do Claude (só no servidor) e modelo por etapa
    supabase/           clientes browser/servidor e renovação de sessão no proxy
    domain.ts           schemas Zod do kit, qa_items e reviews
    local-db.ts         Dexie: espelho local de kits, qa_items e reviews
  proxy.ts              protege rotas logadas
```
