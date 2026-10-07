"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Kit, TipoEntrevista } from "@/lib/domain";
import { localDb } from "@/lib/local-db";
import { DEMO_KIT_ID, semearDemo } from "@/lib/hora-do-show/demo";
import { NOME_TIPO } from "@/lib/hora-do-show/categorias";
import { ABERTAS_NO_GRATIS } from "@/lib/mapa/bloqueio";
import { vagaExemplo } from "@/lib/demo/preparacao";
import { kitRhDaVagaDemo, outraVaga, type KitFicticio } from "@/lib/demo/preparacoes";
import { PALCO, diasAte, estados as calcularEstados, pendentes, type EstadoItem } from "@/lib/pratica/leitner";
import { entrevistaEm } from "@/lib/pratica/formatos";

const TIPOS: TipoEntrevista[] = ["rh", "tecnica", "lideranca"];
const NOME_CURTO: Record<TipoEntrevista, string> = { rh: "RH", tecnica: "Técnica", lideranca: "Liderança" };

type KitReal = {
  kit: Kit;
  estados: EstadoItem[];
  aRevisar: number;
  totalRespostas: number;
};

type Posicao = { tipo: TipoEntrevista } & (
  | { real: KitReal }
  | { ficticio: KitFicticio }
  | { vazia: true }
);

type Vaga = {
  id: string;
  empresa: string;
  cargo: string;
  dias: number | null;
  exemplo: boolean;
  posicoes: Posicao[];
};

function montarPosicoes(real: KitReal | null, ficticios: KitFicticio[]): Posicao[] {
  return TIPOS.map((tipo) => {
    if (real?.kit.tipo === tipo) return { tipo, real };
    const f = ficticios.find((k) => k.tipo === tipo);
    return f ? { tipo, ficticio: f } : { tipo, vazia: true as const };
  });
}

export function Preparacoes({ vazio }: { vazio: boolean }) {
  const [vagas, setVagas] = useState<Vaga[] | null>(null);

  useEffect(() => {
    if (vazio) return;
    (async () => {
      let real: KitReal | null = null;
      let dias: number | null = null;
      try {
        await semearDemo();
        const [kit, itens, reviews] = await Promise.all([
          localDb.kits.get(DEMO_KIT_ID),
          localDb.qaItems.where("kit_id").equals(DEMO_KIT_ID).toArray(),
          localDb.reviews.where("kit_id").equals(DEMO_KIT_ID).toArray(),
        ]);
        if (kit) {
          const agora = new Date();
          const lista = calcularEstados(itens, reviews);
          real = { kit, estados: lista, aRevisar: pendentes(lista, agora).length, totalRespostas: itens.length };
          dias = diasAte(kit.data_entrevista, agora);
        }
      } catch {
        // Sem IndexedDB: a lista mostra só os exemplos.
      }
      setVagas(
        [
          {
            id: "demo",
            empresa: vagaExemplo.empresa,
            cargo: vagaExemplo.cargo,
            dias,
            exemplo: false,
            posicoes: montarPosicoes(real, [kitRhDaVagaDemo]),
          },
          {
            id: outraVaga.id,
            empresa: outraVaga.empresa,
            cargo: outraVaga.cargo,
            dias: outraVaga.diasAteEntrevista,
            exemplo: true,
            posicoes: montarPosicoes(null, outraVaga.kits),
          },
        ].sort((a, b) => (a.dias ?? 999) - (b.dias ?? 999)),
      );
    })();
  }, [vazio]);

  if (vazio) return <Vazio />;
  if (vagas === null) return <p className="sr-only" role="status">Carregando preparações</p>;
  if (vagas.length === 0) return <Vazio />;

  const proxima = vagas[0];
  const kitDaProxima = proxima.posicoes.find((p): p is Posicao & { real: KitReal } => "real" in p);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pt-16">
      <section aria-labelledby="titulo-proxima" className="grid gap-8 border-b border-fio pb-12 lg:grid-cols-[auto_1fr] lg:items-end lg:gap-16">
        <div>
          <h1 id="titulo-proxima" className="text-rotulo text-cinza-quente">
            Próxima entrevista
          </h1>
          <p className="mt-2 font-display text-display-xl font-semibold tabular-nums">
            {proxima.dias ?? "—"}
            <span className="ml-3 text-display-lg text-cinza-quente">{proxima.dias === 1 ? "dia" : "dias"}</span>
          </p>
        </div>
        <div className="lg:pb-4">
          <p className="font-display text-2xl font-medium text-balance">{proxima.cargo}</p>
          <p className="mt-1 text-cinza-quente">{proxima.empresa}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
            {kitDaProxima && <ProximaAcao real={kitDaProxima.real} destaque />}
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

function LinhaVaga({ vaga }: { vaga: Vaga }) {
  return (
    <article aria-label={`${vaga.cargo}, ${vaga.empresa}`}>
      <header className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="font-display text-2xl font-medium">{vaga.cargo}</p>
        <p className="text-cinza-quente">{vaga.empresa}</p>
        <p className="ml-auto text-sm tabular-nums text-cinza-quente">Entrevista {entrevistaEm(vaga.dias)}</p>
      </header>
      {vaga.exemplo && (
        <p className="mt-2 text-rotulo">
          <span className="text-ambar">Exemplo.</span>{" "}
          <span className="text-cinza-quente">Preparação fictícia para mostrar os estados.</span>
        </p>
      )}

      <ul className="mt-5 grid border-y border-fio sm:grid-cols-3 sm:divide-x sm:divide-fio max-sm:divide-y max-sm:divide-fio">
        {vaga.posicoes.map((p) => (
          <li key={p.tipo} className="flex flex-col p-5 sm:min-h-44 sm:px-6">
            {"real" in p ? (
              <PosicaoReal tipo={p.tipo} real={p.real} />
            ) : "ficticio" in p ? (
              <PosicaoFicticia tipo={p.tipo} kit={p.ficticio} />
            ) : (
              <PosicaoVazia tipo={p.tipo} />
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}

function PosicaoReal({ tipo, real }: { tipo: TipoEntrevista; real: KitReal }) {
  const { estados, kit } = real;
  const prontas = estados.filter((e) => e.caixa === PALCO).length;
  const pct = estados.length ? Math.round((prontas / estados.length) * 100) : 0;
  const agora = new Date();

  return (
    <>
      <Topo tipo={tipo} status="Mapa pronto" />
      <p className="mt-4 font-display text-4xl font-semibold tabular-nums">
        {pct}%<span className="ml-2 text-sm font-normal text-cinza-quente">pronto para o show</span>
      </p>
      <ul aria-hidden className="mt-3 flex flex-wrap gap-1.5">
        {estados.map((e) => (
          <li
            key={e.item.id}
            className={`size-2 rounded-full ${
              e.caixa === PALCO
                ? "bg-menta"
                : e.proxima === null || e.proxima <= agora
                  ? "bg-osso"
                  : "border border-cinza-quente"
            }`}
          />
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <ProximaAcao real={real} />
        <p className="mt-2 text-rotulo text-cinza-quente">
          {kit.acesso === "gratis"
            ? `Grátis · ${Math.min(ABERTAS_NO_GRATIS, real.totalRespostas)} de ${real.totalRespostas} abertas`
            : kit.acesso_expira_em
              ? `Avulso · vale até ${new Date(kit.acesso_expira_em).toLocaleDateString("pt-BR")}`
              : "Pro"}
        </p>
      </div>
    </>
  );
}

function ProximaAcao({ real, destaque = false }: { real: KitReal; destaque?: boolean }) {
  const href = real.aRevisar > 0 ? `/kits/demo/pratica` : `/hora-do-show/demo`;
  const texto =
    real.aRevisar > 0
      ? `Praticar ${real.aRevisar} ${real.aRevisar === 1 ? "resposta" : "respostas"}`
      : "Abrir a Hora do Show";
  if (destaque) {
    return (
      <Link
        href={href}
        className="rounded-[3px] bg-fenix px-7 py-3.5 font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
      >
        {texto}
      </Link>
    );
  }
  return (
    <Link href={href} className="group relative inline-block text-osso">
      {texto} →
      <span
        aria-hidden
        className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-osso transition-transform duration-300 ease-brasa group-hover:scale-x-100"
      />
    </Link>
  );
}

const STATUS_FICTICIO: Record<KitFicticio["status"], { status: string; passo: string }> = {
  rascunho: { status: "Rascunho", passo: "Ver diagnóstico" },
  diagnosticado: { status: "Diagnosticado", passo: "Começar a conversa" },
  garimpo: { status: "Na conversa", passo: "Continuar a conversa" },
};

function PosicaoFicticia({ tipo, kit }: { tipo: TipoEntrevista; kit: KitFicticio }) {
  const { status, passo } = STATUS_FICTICIO[kit.status];
  return (
    <>
      <Topo tipo={tipo} status={status} />
      {kit.cobertura ? (
        <div className="mt-4">
          <p className="text-sm">
            <span className="tabular-nums">
              {kit.cobertura.cobertos} de {kit.cobertura.total}
            </span>{" "}
            <span className="text-cinza-quente">requisitos com case</span>
          </p>
          <div aria-hidden className="relative mt-3 h-px bg-fio">
            <div
              className="absolute inset-0 origin-left bg-osso"
              style={{ transform: `scaleX(${kit.cobertura.cobertos / kit.cobertura.total})` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-cinza-quente">Currículo e vaga enviados.</p>
      )}
      <div className="mt-auto pt-6">
        <p className="text-cinza-quente">{passo} →</p>
        <p className="mt-2 text-rotulo text-cinza-quente">Exemplo, sem link</p>
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

function Topo({ tipo, status }: { tipo: TipoEntrevista; status: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="font-medium">{NOME_TIPO[tipo]}</p>
      <p className="text-rotulo text-cinza-quente">{status}</p>
    </div>
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
      <Link
        href="/preparacoes/nova"
        className="mt-10 inline-block rounded-[3px] bg-fenix px-7 py-3.5 font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
      >
        Nova preparação
      </Link>
    </main>
  );
}
