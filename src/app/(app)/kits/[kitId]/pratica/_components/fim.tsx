import Link from "next/link";
import { PALCO, type EstadoItem } from "@/lib/pratica/leitner";
import { nomeCaixa } from "@/lib/pratica/formatos";
import type { Resultado } from "./sessao";
import { Sugestoes } from "./sugestoes";

type Props = {
  kitId: string;
  resultados: Resultado[];
  estados: EstadoItem[];
  onVoltar: () => void;
};

export function Fim({ kitId, resultados, estados, onVoltar }: Props) {
  const avancaram = resultados.filter((r) => r.depois > r.antes).length;
  const prontas = estados.filter((e) => e.caixa === PALCO).length;
  const porcentagem = estados.length ? Math.round((prontas / estados.length) * 100) : 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-12 pb-24 sm:px-8 sm:pt-20">
      <p className="text-rotulo text-cinza-quente">Sessão feita</p>
      <h1 className="mt-3 max-w-[20ch] font-display text-display-lg font-medium text-balance">
        {avancaram === 0
          ? "Nenhuma resposta andou desta vez. Elas voltam na próxima sessão."
          : avancaram === 1
            ? "1 resposta andou rumo ao Palco."
            : `${avancaram} respostas andaram rumo ao Palco.`}
      </h1>

      <ol className="mt-12 divide-y divide-fio border-y border-fio">
        {resultados.map((r, i) => (
          <li
            key={r.estado.item.id}
            className="flex animate-revelar flex-wrap items-baseline gap-x-6 gap-y-1 py-3"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className="flex-1">{r.estado.item.pergunta}</span>
            <span className="text-sm tabular-nums text-cinza-quente">
              {nomeCaixa(r.antes)} →{" "}
              <span className={r.depois === PALCO ? "text-menta" : "text-osso"}>
                {nomeCaixa(r.depois)}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-cinza-quente">
        Pronto para o show agora:{" "}
        <span className="font-display text-2xl font-medium text-osso tabular-nums">{porcentagem}%</span>
      </p>

      <Sugestoes kitId={kitId} estados={estados} className="mt-12" />

      <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4">
        <button
          type="button"
          onClick={onVoltar}
          className="rounded-[3px] bg-fenix px-7 py-3.5 font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
        >
          Voltar para hoje
        </button>
        <Link href={`/hora-do-show/${kitId}`} className="text-osso underline-offset-4 hover:underline">
          Abrir a Hora do Show
        </Link>
      </div>
    </main>
  );
}
