// Marcador das telas ainda sem direção de arte. Toda tela real passa pela
// /sites-incriveis antes de ser construída; este componente só segura a rota.
export function TelaPendente({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-3 px-4 py-16">
      <p className="text-sm text-cinza-quente">Tela pendente de direção de arte</p>
      <h1 className="text-3xl font-semibold">{titulo}</h1>
      <p className="text-cinza-quente">{descricao}</p>
    </main>
  );
}
