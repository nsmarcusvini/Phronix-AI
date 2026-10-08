-- rls_auto_enable é a função do gatilho de evento ensure_rls (liga RLS em toda
-- tabela nova). Gatilho de evento não depende de EXECUTE; tirar o acesso pela
-- API (/rest/v1/rpc) não muda o comportamento.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
