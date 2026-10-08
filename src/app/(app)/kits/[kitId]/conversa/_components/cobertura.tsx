export const META_COBERTURA = 0.8;

// O momento da Conversa: cada requisito da vaga é um ponto que se preenche
// quando um case o cobre. A marca de 80% diz quando já dá para gerar o mapa.
export function Cobertura({
  requisitos,
  cases,
  compacta = false,
}: {
  requisitos: readonly string[];
  cases: { titulo: string; requisitos: readonly string[] }[];
  compacta?: boolean;
}) {
  const cobertoPor = new Map<string, string>();
  for (const c of cases) for (const r of c.requisitos) if (!cobertoPor.has(r)) cobertoPor.set(r, c.titulo);
  const cobertos = requisitos.filter((r) => cobertoPor.has(r)).length;
  const fracao = requisitos.length ? cobertos / requisitos.length : 0;

  return (
    <section aria-labelledby="titulo-cobertura">
      <div className="flex items-baseline justify-between">
        <h2 id="titulo-cobertura" className="text-rotulo text-cinza-quente">
          Cobertura da vaga
        </h2>
        <p className="text-sm tabular-nums" aria-live="polite">
          {cobertos} de {requisitos.length}
          <span className="text-cinza-quente"> requisitos</span>
        </p>
      </div>

      <div aria-hidden className="relative mt-3 h-px bg-fio">
        <div
          className="absolute inset-0 origin-left bg-osso transition-transform duration-700 ease-trilha"
          style={{ transform: `scaleX(${fracao})` }}
        />
        <span
          className="absolute -top-1.5 h-3 w-px bg-cinza-quente"
          style={{ left: `${META_COBERTURA * 100}%` }}
        />
      </div>
      <p aria-hidden className="relative mt-1.5 h-4 text-rotulo text-cinza-quente">
        <span className="absolute -translate-x-1/2" style={{ left: `${META_COBERTURA * 100}%` }}>
          80%
        </span>
      </p>

      {!compacta && (
        <ul className="mt-5 space-y-3">
          {requisitos.map((r) => {
            const caso = cobertoPor.get(r);
            return (
              <li key={r} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className={`mt-1.5 size-2.5 shrink-0 rounded-full transition-[background-color,transform] duration-500 ease-brasa ${
                    caso ? "scale-110 bg-osso" : "border border-cinza-quente"
                  }`}
                />
                <span className="text-sm">
                  <span className={caso ? "text-osso" : "text-cinza-quente"}>{r}</span>
                  <span className="sr-only">{caso ? ", coberto" : ", sem case"}</span>
                  {caso && <span className="block text-rotulo text-cinza-quente">{caso}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
