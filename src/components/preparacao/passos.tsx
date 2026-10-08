// Os passos como trilha: o mesmo fio e os mesmos pontos da Prática.
export function Passos({
  passos,
  atual,
  onVoltar,
}: {
  passos: string[];
  atual: number;
  onVoltar: (passo: number) => void;
}) {
  const meio = 50 / passos.length;
  return (
    <nav aria-label="Passos" className="relative max-w-3xl">
      <span aria-hidden className="absolute top-[5px] h-px bg-fio" style={{ left: `${meio}%`, right: `${meio}%` }} />
      <span
        aria-hidden
        className="absolute top-[5px] h-px origin-left bg-osso transition-transform duration-700 ease-trilha"
        style={{ left: `${meio}%`, right: `${meio}%`, transform: `scaleX(${atual / (passos.length - 1)})` }}
      />
      <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${passos.length}, minmax(0, 1fr))` }}>
        {passos.map((nome, i) => {
          const feito = i < atual;
          const ativo = i === atual;
          return (
            <li key={nome} className="relative flex flex-col items-center">
              <span
                aria-hidden
                className={`relative size-3 rounded-full transition-colors duration-500 ${
                  ativo ? "bg-fenix" : feito ? "bg-osso" : "border border-fio bg-noite"
                }`}
              />
              {feito ? (
                <button
                  type="button"
                  onClick={() => onVoltar(i)}
                  className="mt-3 text-rotulo text-osso underline-offset-4 hover:underline"
                >
                  {nome}
                </button>
              ) : (
                <span
                  aria-current={ativo ? "step" : undefined}
                  className={`mt-3 text-rotulo ${ativo ? "text-osso" : "text-cinza-quente"}`}
                >
                  {nome}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
