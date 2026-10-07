import Link from "next/link";
import type { TipoEntrevista } from "@/lib/domain";
import { NOME_TIPO } from "@/lib/hora-do-show/categorias";
import { entrevistaEm } from "@/lib/pratica/formatos";
import type { ResumoKit, ResumoVaga } from "@/lib/preparacao/listar";

const TIPOS: TipoEntrevista[] = ["rh", "tecnica", "lideranca"];
const NOME_CURTO: Record<TipoEntrevista, string> = { rh: "RH", tecnica: "Técnica", lideranca: "Liderança" };

const STATUS: Record<ResumoKit["status"], string> = {
  rascunho: "Rascunho",
  diagnosticado: "Diagnosticado",
  garimpo: "Na conversa",
  pronto: "Mapa pronto",
};

// Minhas preparações, a partir do banco. A próxima entrevista ocupa o topo;
// cada vaga mostra as três posições de kit (RH, Técnica, Liderança).
export function Preparacoes({ vagas }: { vagas: ResumoVaga[] }) {
  if (vagas.length === 0) return <Vazio />;

  const proxima = vagas[0];
  const kitDaProxima = TIPOS.map((t) => proxima.kits[t]).find((k): k is ResumoKit => k !== undefined);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pt-16">
      <section
        aria-labelledby="titulo-proxima"
        className="grid gap-8 border-b border-fio pb-12 lg:grid-cols-[auto_1fr] lg:items-end lg:gap-16"
      >
        <div>
          <h1 id="titulo-proxima" className="text-rotulo text-cinza-quente">
            Próxima entrevista
          </h1>
          {proxima.dias !== null ? (
            <p className="mt-2 font-display text-display-xl font-semibold tabular-nums">
              {proxima.dias}
              <span className="ml-3 text-display-lg text-cinza-quente">{proxima.dias === 1 ? "dia" : "dias"}</span>
            </p>
          ) : (
            <p className="mt-2 font-display text-display-lg font-semibold">Sem data</p>
          )}
        </div>
        <div className="lg:pb-4">
          <p className="font-display text-2xl font-medium text-balance">{proxima.cargo ?? "Vaga sem cargo"}</p>
          {proxima.empresa && <p className="mt-1 text-cinza-quente">{proxima.empresa}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
            {kitDaProxima && (
              <Link
                href={kitDaProxima.proxima.href}
                className="rounded-[3px] bg-fenix px-7 py-3.5 font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
              >
                {kitDaProxima.proxima.texto}
              </Link>
            )}
            <Link href="/preparacoes/nova" className="text-osso underline-offset-4 hover:underline">
              Nova preparação
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="titulo-lista" className="mt-14">
        <h2 id="titulo-lista" className="text-rotulo text-cinza-quente">
          Suas preparações
        </h2>
        <ol className="mt-4 space-y-12">
          {vagas.map((vaga) => (
            <li key={vaga.id}>
              <LinhaVaga vaga={vaga} />
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

function LinhaVaga({ vaga }: { vaga: ResumoVaga }) {
  return (
    <article aria-label={[vaga.cargo, vaga.empresa].filter(Boolean).join(", ")}>
      <header className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="font-display text-2xl font-medium">{vaga.cargo ?? "Vaga sem cargo"}</p>
        {vaga.empresa && <p className="text-cinza-quente">{vaga.empresa}</p>}
        <p className="ml-auto text-sm tabular-nums text-cinza-quente">Entrevista {entrevistaEm(vaga.dias)}</p>
      </header>

      <ul className="mt-5 grid border-y border-fio sm:grid-cols-3 sm:divide-x sm:divide-fio max-sm:divide-y max-sm:divide-fio">
        {TIPOS.map((tipo) => {
          const kit = vaga.kits[tipo];
          return (
            <li key={tipo} className="flex flex-col p-5 sm:min-h-44 sm:px-6">
              {kit ? <PosicaoKit tipo={tipo} kit={kit} /> : <PosicaoVazia tipo={tipo} />}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function PosicaoKit({ tipo, kit }: { tipo: TipoEntrevista; kit: ResumoKit }) {
  const pct = kit.total ? Math.round((kit.prontas / kit.total) * 100) : 0;
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium">{NOME_TIPO[tipo]}</p>
        <p className="text-rotulo text-cinza-quente">{STATUS[kit.status]}</p>
      </div>
      {kit.total > 0 ? (
        <>
          <p className="mt-4 font-display text-4xl font-semibold tabular-nums">
            {pct}%<span className="ml-2 text-sm font-normal text-cinza-quente">pronto para o show</span>
          </p>
          <ul aria-hidden className="mt-3 flex flex-wrap gap-1.5">
            {kit.pontos.map((p, i) => (
              <li
                key={i}
                className={`size-2 rounded-full ${
                  p === "palco" ? "bg-menta" : p === "revisar" ? "bg-osso" : "border border-cinza-quente"
                }`}
              />
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-sm text-cinza-quente">O mapa sai depois da conversa.</p>
      )}
      <div className="mt-auto pt-6">
        <Link href={kit.proxima.href} className="group relative inline-block text-osso">
          {kit.proxima.texto} →
          <span
            aria-hidden
            className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-osso transition-transform duration-300 ease-brasa group-hover:scale-x-100"
          />
        </Link>
        <p className="mt-2 text-rotulo text-cinza-quente">{kit.acesso}</p>
      </div>
    </>
  );
}

function PosicaoVazia({ tipo }: { tipo: TipoEntrevista }) {
  return (
    <Link
      href="/preparacoes/nova"
      className="group flex flex-1 flex-col justify-between gap-3 rounded-[3px] text-cinza-quente transition-colors duration-200 hover:text-osso"
    >
      <span className="text-rotulo">{NOME_CURTO[tipo]}</span>
      <span>
        <span className="font-display text-xl font-medium">+ kit de {NOME_CURTO[tipo]}</span>
        <span className="mt-1 block text-sm">Mesma vaga, sem enviar nada de novo.</span>
      </span>
    </Link>
  );
}

function Vazio() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-16 pb-24 sm:px-8 sm:pt-24">
      <p className="text-rotulo text-cinza-quente">Suas preparações</p>
      <h1 className="mt-3 max-w-[16ch] font-display text-display-lg font-medium text-balance">
        Tem entrevista marcada? Comece por ela.
      </h1>
      <p className="mt-4 max-w-prose text-cinza-quente">
        Currículo e vaga viram um roteiro curto, ensaiado e à mão na hora do show.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
        <Link
          href="/preparacoes/nova"
          className="inline-block rounded-[3px] bg-fenix px-7 py-3.5 font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
        >
          Nova preparação
        </Link>
        <Link href="/kits/demo/pratica" className="text-osso underline-offset-4 hover:underline">
          Ver um kit de demonstração
        </Link>
      </div>
    </main>
  );
}
