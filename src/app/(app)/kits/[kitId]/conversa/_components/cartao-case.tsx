import { Campo } from "@/components/campo-inline";
import { ComMarcadores } from "@/components/com-marcadores";
import type { CaseRascunho, OrigemCase } from "@/lib/demo/preparacao";

const ORIGEM: Record<OrigemCase, string> = {
  cv: "do currículo",
  conversa: "da conversa",
  estimativa: "estimativa",
};

// STAR compacto: título, situação, 2 ações, resultado, requisitos e origem.
export function CartaoCase({
  caso,
  onTitulo,
  onDescartar,
}: {
  caso: CaseRascunho;
  onTitulo: (titulo: string) => void;
  onDescartar: () => void;
}) {
  return (
    <article className="animate-revelar border-t border-fio pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-rotulo ${caso.origem === "estimativa" ? "text-ambar" : "text-cinza-quente"}`}>
          {ORIGEM[caso.origem]}
        </span>
        <button
          type="button"
          onClick={onDescartar}
          className="text-rotulo text-cinza-quente underline-offset-4 hover:text-osso hover:underline"
        >
          Descartar
        </button>
      </div>
      <div className="mt-1">
        <Campo
          rotulo="título do case"
          valor={caso.titulo}
          onChange={onTitulo}
          linhaUnica
          className="font-display text-lg font-medium"
        />
      </div>
      <p className="mt-2 text-sm text-cinza-quente">{caso.situacao}</p>
      <ul className="mt-2 space-y-1 text-sm">
        {caso.acoes.map((a) => (
          <li key={a} className="flex gap-2">
            <span aria-hidden className="mt-[0.7em] h-px w-2.5 shrink-0 bg-fio" />
            {a}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm font-medium">
        <ComMarcadores texto={caso.resultado} />
      </p>
      <p className="mt-3 flex flex-wrap gap-1.5">
        {caso.requisitos.map((r) => (
          <span key={r} className="rounded-[3px] border border-fio px-2 py-0.5 text-rotulo text-cinza-quente">
            {r}
          </span>
        ))}
      </p>
    </article>
  );
}
