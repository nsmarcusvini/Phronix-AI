import { demoItens } from "@/lib/hora-do-show/demo";

// O momento único da landing: uma resposta de verdade (o exemplo do PRD) se
// monta como na Hora do Show, e o fio de tempo enche até 28 s, antes da marca
// de 30 s. Só CSS: com reduced motion, aparece já no estado final.

const ITEM = demoItens.find((i) => i.categoria === "experiencia_cases")!;
const ESCALA = 36; // segundos representados pela largura do fio
const FALADA = 28;
const LIMITE = 30;

export function RespostaHero() {
  return (
    <figure aria-label="Exemplo de resposta de 30 segundos" className="font-show">
      <p className="animate-revelar text-hs-pergunta text-cinza-quente" style={{ animationDelay: "150ms" }}>
        {ITEM.pergunta}
      </p>
      <p
        className="mt-3 animate-revelar text-hs-gancho font-bold text-pretty"
        style={{ animationDelay: "400ms" }}
      >
        {ITEM.gancho}
      </p>
      <p
        className="mt-5 flex animate-revelar flex-wrap items-baseline gap-x-5 gap-y-1 text-hs-ancora font-semibold"
        style={{ animationDelay: "650ms" }}
      >
        {ITEM.ancoras.map((a) => (
          <span key={a}>{a}</span>
        ))}
        <span className="ml-auto text-fenix tabular-nums">{ITEM.numero_impacto}</span>
      </p>

      <div className="mt-10" aria-hidden>
        <div className="relative h-4">
          <div className="absolute inset-x-0 top-1/2 h-px bg-fio" />
          <div
            className="absolute top-1/2 left-0 h-px origin-left animate-tempo bg-osso"
            style={{ width: `${(FALADA / ESCALA) * 100}%` }}
          />
          <span
            className="absolute top-0 h-4 w-px bg-cinza-quente"
            style={{ left: `${(LIMITE / ESCALA) * 100}%` }}
          />
        </div>
        <div className="relative mt-2 h-5 text-sm tabular-nums">
          <span
            className="absolute -translate-x-full animate-revelar text-osso"
            style={{ left: `${(FALADA / ESCALA) * 100}%`, animationDelay: "3200ms" }}
          >
            {FALADA} s
          </span>
          <span className="absolute pl-2 text-cinza-quente" style={{ left: `${(LIMITE / ESCALA) * 100}%` }}>
            {LIMITE} s
          </span>
        </div>
      </div>
      <figcaption className="sr-only">
        Resposta de exemplo falada em cerca de {FALADA} segundos, dentro do limite de {LIMITE}.
      </figcaption>
    </figure>
  );
}
