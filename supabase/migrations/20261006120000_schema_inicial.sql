-- Phronix AI · schema inicial
--
-- O kit é a unidade central: tudo pertence a um kit, e cada kit a um usuário.
-- Toda tabela tem RLS e só libera as linhas do próprio usuário (direto por
-- user_id ou pelo kit). Chaves estrangeiras compostas garantem que um kit só
-- aponte para currículo, vaga e cases do mesmo dono.
--
-- Cobrança e custo (subscriptions, ai_usage, plano, acesso do kit, desbloqueio
-- de respostas) só são escritos pelo servidor com a service role; o usuário
-- não tem permissão nessas colunas.
--
-- Excluir o usuário em auth.users apaga todos os dados dele em cascata (LGPD).
-- Os arquivos do Storage precisam ser removidos à parte, pela API.

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.tipo_entrevista as enum ('rh', 'tecnica', 'lideranca');
create type public.nivel as enum ('junior', 'pleno', 'senior');
create type public.confianca as enum ('alta', 'media', 'baixa');
create type public.plano as enum ('gratis', 'avulso', 'pro_mensal', 'pro_trimestral');
create type public.acesso_kit as enum ('gratis', 'avulso', 'pro');
create type public.status_kit as enum ('rascunho', 'diagnosticado', 'garimpo', 'pronto');
create type public.papel_mensagem as enum ('user', 'assistant');
create type public.origem_case as enum ('cv', 'conversa', 'estimativa');
create type public.categoria_qa as enum (
  'abertura',
  'motivacao_fit',
  'experiencia_cases',
  'competencias_tecnicas',
  'perguntas_dificeis',
  'perguntas_entrevistador'
);
create type public.exercicio as enum (
  'flashcard',
  'ancoras',
  'lacunas',
  'ordenar',
  'relampago',
  'ensaio_geral'
);
create type public.nota_review as enum ('errei', 'quase', 'acertei');
create type public.etapa_ia as enum (
  'extrair_curriculo',
  'extrair_vaga',
  'diagnostico',
  'garimpo',
  'mapa',
  'reescrita',
  'validador'
);

-- ---------------------------------------------------------------------------
-- Funções de gatilho
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Tabelas espelhadas no aparelho (Dexie) sincronizam com "última escrita vence".
-- Se o cliente manda updated_at mais antigo que o do banco, o update é ignorado;
-- se não manda nenhum, o banco carimba o horário atual.
create function public.ultima_escrita_vence()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.updated_at is not distinct from old.updated_at then
    new.updated_at := now();
  elsif new.updated_at < old.updated_at then
    return null;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  plano public.plano not null default 'gratis',
  consentimento_lgpd_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, new.raw_user_meta_data ->> 'nome');
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- resumes e jobs
-- ---------------------------------------------------------------------------

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Caminho no bucket "curriculos". Vira null quando o arquivo é apagado
  -- após a extração; ficam só o texto e os dados estruturados.
  arquivo_path text,
  texto text,
  dados_json jsonb,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create index resumes_user_id_idx on public.resumes (user_id);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  empresa text,
  cargo text,
  texto text not null,
  dados_json jsonb,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create index jobs_user_id_idx on public.jobs (user_id);

-- ---------------------------------------------------------------------------
-- kits
-- ---------------------------------------------------------------------------

create table public.kits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  resume_id uuid not null,
  job_id uuid not null,
  tipo public.tipo_entrevista not null,
  nivel public.nivel,
  nivel_confianca public.confianca,
  -- O ajuste manual do usuário prevalece sobre o diagnóstico em todo o kit.
  nivel_ajustado boolean not null default false,
  match_score smallint check (match_score between 0 and 100),
  diagnostico_json jsonb,
  data_entrevista date,
  status public.status_kit not null default 'rascunho',
  -- Unidade de compra: definido pelo servidor (webhook de pagamento).
  acesso public.acesso_kit not null default 'gratis',
  acesso_expira_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (resume_id, user_id) references public.resumes (id, user_id) on delete cascade,
  foreign key (job_id, user_id) references public.jobs (id, user_id) on delete cascade
);

create index kits_user_id_idx on public.kits (user_id);
create index kits_resume_id_user_id_idx on public.kits (resume_id, user_id);
create index kits_job_id_user_id_idx on public.kits (job_id, user_id);

create trigger kits_ultima_escrita_vence
  before update on public.kits
  for each row execute function public.ultima_escrita_vence();

-- ---------------------------------------------------------------------------
-- Garimpo de cases
-- ---------------------------------------------------------------------------

create table public.discovery_messages (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.kits (id) on delete cascade,
  papel public.papel_mensagem not null,
  conteudo text not null,
  criado_em timestamptz not null default now()
);

create index discovery_messages_kit_id_criado_em_idx
  on public.discovery_messages (kit_id, criado_em);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.kits (id) on delete cascade,
  titulo text not null,
  situacao text not null,
  acoes text[] not null default '{}',
  resultado text,
  metrica text,
  origem public.origem_case not null,
  requisitos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, kit_id)
);

create index cases_kit_id_idx on public.cases (kit_id);

create trigger cases_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Mapa de perguntas e respostas
-- ---------------------------------------------------------------------------

create table public.qa_items (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.kits (id) on delete cascade,
  categoria public.categoria_qa not null,
  pergunta text not null,
  gancho text,
  bullets text[] not null default '{}' check (cardinality(bullets) <= 3),
  ancoras text[] not null default '{}' check (cardinality(ancoras) <= 3),
  expandida text,
  case_id uuid,
  ordem integer not null,
  fixado boolean not null default false,
  pendente_confirmacao boolean not null default false,
  -- Plano grátis: além das 8 primeiras, as respostas chegam bloqueadas e ficam
  -- invisíveis ao usuário até o pagamento (o servidor desbloqueia).
  bloqueado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, kit_id),
  foreign key (case_id, kit_id) references public.cases (id, kit_id) on delete set null (case_id)
);

create index qa_items_kit_id_ordem_idx on public.qa_items (kit_id, ordem);
create index qa_items_case_id_kit_id_idx on public.qa_items (case_id, kit_id);

create trigger qa_items_ultima_escrita_vence
  before update on public.qa_items
  for each row execute function public.ultima_escrita_vence();

-- ---------------------------------------------------------------------------
-- Prática (repetição espaçada)
-- ---------------------------------------------------------------------------

-- Cada linha é um evento de revisão, gerado no aparelho (id criado no cliente)
-- e enviado quando há rede. A caixa atual de uma resposta é a da última revisão.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null,
  qa_item_id uuid not null,
  exercicio public.exercicio not null,
  nota public.nota_review not null,
  caixa smallint not null check (caixa between 1 and 5),
  proxima_revisao timestamptz not null,
  revisado_em timestamptz not null,
  foreign key (qa_item_id, kit_id) references public.qa_items (id, kit_id) on delete cascade
);

create index reviews_kit_id_idx on public.reviews (kit_id);
create index reviews_qa_item_id_revisado_em_idx on public.reviews (qa_item_id, revisado_em desc);

-- ---------------------------------------------------------------------------
-- Hora do Show
-- ---------------------------------------------------------------------------

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.kits (id) on delete cascade,
  inicio timestamptz not null,
  fim timestamptz,
  respondidas uuid[] not null default '{}'
);

create index live_sessions_kit_id_idx on public.live_sessions (kit_id);

-- ---------------------------------------------------------------------------
-- Custo de IA e assinaturas (escrita só pela service role)
-- ---------------------------------------------------------------------------

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kit_id uuid references public.kits (id) on delete set null,
  etapa public.etapa_ia not null,
  modelo text not null,
  tokens_entrada integer not null default 0,
  tokens_saida integer not null default 0,
  tokens_cache_leitura integer not null default 0,
  tokens_cache_escrita integer not null default 0,
  -- Em dólares, calculado no servidor a partir da tabela de preços do modelo.
  custo numeric(12, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index ai_usage_user_id_created_at_idx on public.ai_usage (user_id, created_at desc);
create index ai_usage_kit_id_idx on public.ai_usage (kit_id);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provedor text not null,
  provedor_assinatura_id text not null,
  plano public.plano not null,
  status text not null,
  periodo_fim timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provedor, provedor_assinatura_id)
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Permissões por coluna
-- ---------------------------------------------------------------------------

-- profiles: o usuário edita nome e consentimento; plano é do servidor.
revoke insert, update on public.profiles from anon, authenticated;
grant update (nome, consentimento_lgpd_em) on public.profiles to authenticated;

-- kits: acesso e posse não mudam pelo cliente.
revoke insert, update on public.kits from anon, authenticated;
grant insert (id, resume_id, job_id, tipo, data_entrevista)
  on public.kits to authenticated;
grant update (
  nivel, nivel_confianca, nivel_ajustado, match_score, diagnostico_json,
  data_entrevista, status, updated_at
) on public.kits to authenticated;

-- qa_items: o cliente não desbloqueia respostas nem troca o kit.
revoke update on public.qa_items from anon, authenticated;
grant update (
  categoria, pergunta, gancho, bullets, ancoras, expandida, case_id, ordem,
  fixado, pendente_confirmacao, updated_at
) on public.qa_items to authenticated;

-- ai_usage e subscriptions: só leitura para o usuário.
revoke insert, update, delete on public.ai_usage from anon, authenticated;
revoke insert, update, delete on public.subscriptions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.jobs enable row level security;
alter table public.kits enable row level security;
alter table public.discovery_messages enable row level security;
alter table public.cases enable row level security;
alter table public.qa_items enable row level security;
alter table public.reviews enable row level security;
alter table public.live_sessions enable row level security;
alter table public.ai_usage enable row level security;
alter table public.subscriptions enable row level security;

-- profiles
create policy "profiles: dono lê" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: dono edita" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- resumes, jobs, kits: posse direta por user_id
create policy "resumes: dono" on public.resumes
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "jobs: dono" on public.jobs
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "kits: dono" on public.kits
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Tabelas do kit: posse pelo kit
create policy "discovery_messages: dono lê" on public.discovery_messages
  for select to authenticated
  using (kit_id in (select id from public.kits where user_id = (select auth.uid())));
create policy "discovery_messages: dono envia" on public.discovery_messages
  for insert to authenticated
  with check (kit_id in (select id from public.kits where user_id = (select auth.uid())));

create policy "cases: dono" on public.cases
  for all to authenticated
  using (kit_id in (select id from public.kits where user_id = (select auth.uid())))
  with check (kit_id in (select id from public.kits where user_id = (select auth.uid())));

-- Respostas bloqueadas ficam fora de todas as operações do usuário.
create policy "qa_items: dono" on public.qa_items
  for all to authenticated
  using (
    not bloqueado
    and kit_id in (select id from public.kits where user_id = (select auth.uid()))
  )
  with check (kit_id in (select id from public.kits where user_id = (select auth.uid())));

create policy "reviews: dono lê" on public.reviews
  for select to authenticated
  using (kit_id in (select id from public.kits where user_id = (select auth.uid())));
create policy "reviews: dono registra" on public.reviews
  for insert to authenticated
  with check (kit_id in (select id from public.kits where user_id = (select auth.uid())));

create policy "live_sessions: dono" on public.live_sessions
  for all to authenticated
  using (kit_id in (select id from public.kits where user_id = (select auth.uid())))
  with check (kit_id in (select id from public.kits where user_id = (select auth.uid())));

create policy "ai_usage: dono lê" on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));

create policy "subscriptions: dono lê" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: currículos em bucket privado, uma pasta por usuário
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'curriculos',
  'curriculos',
  false,
  5242880,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

create policy "curriculos: dono envia" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'curriculos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "curriculos: dono lê" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'curriculos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "curriculos: dono apaga" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'curriculos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
