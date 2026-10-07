import type { QaItem } from "@/lib/domain";

type Props = {
  item: QaItem;
  soAncoras: boolean;
  expandida: boolean;
  respondida: boolean;
  foco: boolean;
};

// Hierarquia de relance: gancho e âncoras gritam, o resto sussurra.
export function Resposta(props: Props) {
  const { item, expandida, respondida, foco } = props;
  // Perguntas para o entrevistador não têm gancho: a própria pergunta é o que se fala.
  const fala = item.gancho ?? item.pergunta;
  const mostrarExpandida = expandida && item.expandida;
  // Sem âncoras (perguntas para o entrevistador), "só âncoras" mostra a fala.
  const soAncoras = props.soAncoras && item.ancoras.length > 0;

  return (
    <article aria-live="polite">
      {!foco && item.gancho && (
        <p className="text-hs-pergunta text-cinza-quente">
          {item.pergunta}
          {respondida && <span> · respondida</span>}
        </p>
      )}

      {!soAncoras && (
        <h2 className="mt-2 text-hs-gancho font-bold text-pretty">
          <ComMarcadores texto={fala} />
        </h2>
      )}

      {(item.ancoras.length > 0 || item.numero_impacto) && (
        <p
          className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 font-semibold ${
            soAncoras ? "mt-2 text-hs-gancho" : "mt-4 text-hs-ancora"
          }`}
        >
          {item.ancoras.map((ancora, i) => (
            <span key={ancora} className="flex items-baseline gap-x-3">
              {i > 0 && (
                <span aria-hidden className="text-fio">
                  ·
                </span>
              )}
              {ancora}
            </span>
          ))}
          {item.numero_impacto && (
            <span className="ml-auto pl-4 font-bold text-fenix tabular-nums">
              {item.numero_impacto}
            </span>
          )}
        </p>
      )}

      {!soAncoras && mostrarExpandida && (
        <div className="mt-6 max-w-[36rem]">
          <p className="text-hs-sidebar text-cinza-quente">Follow-up</p>
          <p className="mt-1 text-hs-bullet">
            <ComMarcadores texto={item.expandida!} />
          </p>
        </div>
      )}

      {!soAncoras && !mostrarExpandida && item.bullets.length > 0 && (
        <ul className="mt-6 max-w-[36rem] space-y-2 text-hs-bullet">
          {item.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3">
              <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-cinza-quente" />
              <span>
                <ComMarcadores texto={bullet} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

// Dado que falta vira [confirmar: …], destacado em Âmbar até o usuário resolver.
function ComMarcadores({ texto }: { texto: string }) {
  const partes = texto.split(/(\[confirmar:[^\]]*\])/g);
  return partes.map((parte, i) =>
    parte.startsWith("[confirmar:") ? (
      <mark
        key={i}
        className="bg-transparent text-ambar underline decoration-dotted underline-offset-4"
      >
        {parte}
      </mark>
    ) : (
      parte
    ),
  );
}
