-- Tour guiado do primeiro acesso: null = ainda não viu; preenchido ao concluir ou pular.
alter table public.profiles add column tour_concluido_em timestamptz;

-- Contas que já existiam já passaram pelo primeiro acesso.
update public.profiles set tour_concluido_em = now() where tour_concluido_em is null;

grant update (tour_concluido_em) on public.profiles to authenticated;
