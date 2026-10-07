import Link from "next/link";
import type { Review } from "@/lib/domain";
import {
  PALCO,
  TAMANHO_SESSAO,
  pendentes,
  revisoesDeHoje,
  sequencia,
  type EstadoItem,
} from "@/lib/pratica/leitner";
import { entrevistaEm, quando } from "@/lib/pratica/formatos";
import { Trilha } from "./trilha";
import { Sugestoes } from "./sugestoes";

type Props = {
  kitId: string;
  estados: EstadoItem[];
  reviews: Review[];
  dias: number | null;
  agora: Date;
  onComecar: () => void;
  onRelampago: () => void;
};

export function Hoje({ kitId, estados, reviews, dias, agora, onComecar, onRelampago }: Props) {
  const prontas = estados.filter((e) => e.caixa === PALCO).length;
  const total = estados.length;
  const porcentagem = total ? Math.round((prontas / total) * 100) : 0;
  const fila = pendentes(estados, agora);
  const naSessao = Math.min(fila.length, TAMANHO_SESSAO);
  const feitasHoje = revisoesDeHoje(reviews, agora);
  const seguidos = sequencia(reviews, agora);
  const proxima = estados
    .map((e) => e.proxima)
    .filter((d): d is Date => d !== null && d > agora)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pt-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_17rem] lg:items-end">
        <section aria-labelledby="titulo-pronto">
          <h1 id="titulo-pronto" className="text-rotulo text-cinza-quente">
            Pronto para o show
          </h1>
          <p className="mt-2 font-display text-display-xl font-semibold tabular-nums">
            {porcentagem}
            <span className="ml-1 align-top text-display-lg text-cinza-quente">%</span>
          </p>
          <p className="mt-4 text-cinza-quente">
            {prontas} de {total} respostas no Palco
          </p>
        </section>

        <dl className="grid grid-cols-3 gap-6 border-fio lg:grid-cols-1 lg:border-l lg:pl-8">
          <div>
            <dt className="text-rotulo text-cinza-quente">Entrevista</dt>
            <dd className="mt-1 font-display text-xl font-medium whitespace-nowrap sm:text-2xl">{entrevistaEm(dias)}</dd>
          </div>
          <div>
            <dt className="text-rotulo text-cinza-quente">Sequência</dt>
            <dd className="mt-1 flex items-center gap-2 font-display text-xl font-medium whitespace-nowrap sm:text-2xl">
              {seguidos > 0 && <span aria-hidden className="size-2 rounded-full bg-ambar" />}
              {seguidos === 1 ? "1 dia" : `${seguidos} dias`}
            </dd>
          </div>
          <div>
            <dt className="text-rotulo text-cinza-quente">Meta de hoje</dt>
            <dd className="mt-1 font-display text-xl font-medium tabular-nums sm:text-2xl">
              {Math.min(feitasHoje, TAMANHO_SESSAO)}
              <span className="text-cinza-quente">/{TAMANHO_SESSAO}</span>
            </dd>
            <div aria-hidden className="mt-2 h-px w-full bg-fio">
              <div
                className="h-px origin-left bg-osso"
                style={{ transform: `scaleX(${Math.min(1, feitasHoje / TAMANHO_SESSAO)})` }}
              />
            </div>
          </div>
        </dl>
      </div>

      <div className="mt-16 sm:mt-20">
        <Trilha estados={estados} agora={agora} />
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5">
        {naSessao > 0 ? (
          <>
            <button
              type="button"
              onClick={onComecar}
              className="rounded-[3px] bg-fenix px-7 py-3.5 font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
            >
              Começar sessão
            </button>
            <p className="text-cinza-quente">
              {naSessao} para revisar · ~{Math.max(1, Math.round(naSessao * 0.8))} min
            </p>
          </>
        ) : (
          <p className="text-cinza-quente">
            Nada para revisar agora.
            {proxima && ` Próxima revisão ${quando(proxima, agora)}.`}
          </p>
        )}
        <button
          type="button"
          onClick={onRelampago}
          className="group relative py-1 text-osso sm:ml-auto"
        >
          Pergunta-relâmpago
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-osso transition-transform duration-300 ease-brasa group-hover:scale-x-100"
          />
        </button>
      </div>

      <Sugestoes kitId={kitId} estados={estados} className="mt-16" />

      <p className="mt-16 text-rotulo text-cinza-quente">
        Tudo fica salvo neste aparelho.{" "}
        <Link href={`/hora-do-show/${kitId}`} className="text-osso underline-offset-4 hover:underline">
          Abrir a Hora do Show
        </Link>
      </p>
    </main>
  );
}
