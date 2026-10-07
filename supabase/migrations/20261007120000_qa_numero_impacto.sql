-- Número de impacto em destaque na resposta (Hora do Show e Prática).
alter table public.qa_items add column numero_impacto text;

grant update (numero_impacto) on public.qa_items to authenticated;
