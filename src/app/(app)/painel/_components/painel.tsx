"use client";

/*
 * Painel na direção "Vestiário" (herda a Trilha e a paleta Brasa).
 * - O painel é o vestiário antes do palco: a vaga em foco toma o topo em
 *   escala de pôster, com três anéis concêntricos (RH fora, Técnica no meio,
 *   Liderança dentro). Cada anel é um kit e fecha quando ele está pronto.
 * - Cor é estado, não tipo: progresso em Osso, anel fechado em Menta, kit
 *   que não existe em tracejado. O tipo vem da posição e do rótulo, porque
 *   Menta e Âmbar já significam "no palco" e "atenção" no resto do app.
 * - As outras vagas ficam numa faixa de anéis pequenos; tocar numa traz para
 *   o foco e os anéis grandes se refazem com os números dela.
 * - Fênix só no botão da ação da vaga em foco.
 */

import Link from "next/link";
import { useState } from "react";
import type { TipoEntrevista } from "@/lib/domain";
import { entrevistaEm } from "@/lib/pratica/formatos";
import type { MetricasPratica } from "@/lib/pratica/metricas";
import type { CurriculoAtual } from "@/lib/preparacao/curriculo";
import type { ResumoKit, ResumoVaga } from "@/lib/preparacao/listar";
import { Entrevistas } from "./entrevistas";
import { ResumoPratica } from "./resumo-pratica";

const NOVA_VAGA = "/painel/nova-vaga";

// De fora para dentro: a ordem dos anéis.
const TIPOS: TipoEntrevista[] = ["rh", "tecnica", "lideranca"];
const NOME_CURTO: Record<TipoEntrevista, string> = { rh: "RH", tecnica: "Técnica", lideranca: "Liderança" };

const STATUS: Record<ResumoKit["status"], string> = {
  rascunho: "Rascunho",
  diagnosticado: "Diagnosticado",
  garimpo: "Na conversa",
  pronto: "Mapa pronto",
};

function pronto(kit: ResumoKit | undefined) {
  return kit && kit.total ? Math.round((kit.prontas / kit.total) * 100) : 0;
}

// Painel: a casa da pessoa depois do onboarding. A Prática vem primeiro, com
// as métricas sempre à vista; depois o placar da vaga em foco, todas as
// entrevistas com atalhos e o currículo.
export function Painel({
  vagas,
  curriculo,
  metricas,
}: {
  vagas: ResumoVaga[];
  curriculo: CurriculoAtual;
  metricas: MetricasPratica;
}) {
  const [focoId, setFocoId] = useState(vagas[0]?.id ?? null);
  const foco = vagas.find((v) => v.id === focoId) ?? vagas[0];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pt-12">
      <ResumoPratica metricas={metricas} vagas={vagas} />
      {foco ? (
        <>
          <Foco vaga={foco} proxima={foco.id === vagas[0].id} />
          {vagas.length > 1 && <Faixa vagas={vagas} focoId={foco.id} onFocar={setFocoId} />}
          <Entrevistas vagas={vagas} />
        </>
      ) : (
        <Vazio nome={curriculo.dados.nome.valor} />
      )}
      <SeuCurriculo curriculo={curriculo} />
    </main>
  );
}

// Três anéis concêntricos. O key do pai refaz a animação quando o foco muda.
function Aneis({ vaga, grande = false }: { vaga: ResumoVaga; grande?: boolean }) {
  const traco = grande ? 7 : 9;
  const raios = [45, 34, 23];
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="block size-full -rotate-90">
      {TIPOS.map((tipo, i) => {
        const kit = vaga.kits[tipo];
        const pct = pronto(kit);
        const fechado = kit !== undefined && pct === 100;
        return (
          <g key={tipo}>
            <circle
              cx="50"
              cy="50"
              r={raios[i]}
              fill="none"
              strokeWidth={kit ? traco : 1}
              strokeDasharray={kit ? undefined : "1.5 3"}
              className={kit ? "stroke-fio" : "stroke-cinza-quente/60"}
            />
            {kit && (
              <circle
                cx="50"
                cy="50"
                r={raios[i]}
                fill="none"
                strokeWidth={traco}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="100 100"
                style={{ "--alvo": 100 - pct, animationDelay: `${i * 90}ms` } as React.CSSProperties}
                className={`animate-fechar-anel ${pct === 0 ? "opacity-0" : ""} ${fechado ? "stroke-menta" : "stroke-osso"}`}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Dias({ dias }: { dias: number | null }) {
  if (dias === null) {
    return <p className="font-display text-display-xl font-semibold">Sem data</p>;
  }
  return (
    <p className="font-display text-display-xl font-semibold tabular-nums">
      {dias}
      <span className="ml-3 text-display-lg text-cinza-quente">{dias === 1 ? "dia" : "dias"}</span>
    </p>
  );
}

function Foco({ vaga, proxima }: { vaga: ResumoVaga; proxima: boolean }) {
  const kitDaAcao = TIPOS.map((t) => vaga.kits[t]).find((k): k is ResumoKit => k !== undefined);

  return (
    <section
      aria-labelledby="titulo-foco"
      className="grid gap-10 border-b border-fio pb-14 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-center lg:gap-16"
    >
      {/* Desktop: anéis em escala de pôster na coluna da esquerda. */}
      <div key={`grande-${vaga.id}`} data-tour="aneis" className="hidden aspect-square w-full lg:block">
        <Aneis vaga={vaga} grande />
      </div>

      <div>
        <h1 id="titulo-foco" className="text-rotulo text-cinza-quente">
          {proxima ? "Próxima entrevista" : `Entrevista ${entrevistaEm(vaga.dias)}`}
        </h1>
        {/* Celular: os anéis ficam colados na contagem, que é o momento da tela. */}
        <div className="mt-2 flex items-center justify-between gap-4">
          <Dias dias={vaga.dias} />
          <div key={`compacto-${vaga.id}`} data-tour="aneis" className="aspect-square w-28 shrink-0 sm:w-36 lg:hidden">
            <Aneis vaga={vaga} grande />
          </div>
        </div>
        <p className="mt-4 font-display text-2xl font-medium text-balance">{vaga.cargo ?? "Vaga sem cargo"}</p>
        {vaga.empresa && <p className="mt-1 text-cinza-quente">{vaga.empresa}</p>}

        <ol className="mt-8 divide-y divide-fio border-y border-fio">
          {TIPOS.map((tipo, i) => (
            <li key={tipo}>
              <LinhaKit tipo={tipo} posicao={i} kit={vaga.kits[tipo]} vagaId={vaga.id} />
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          {kitDaAcao && (
            <Link
              href={kitDaAcao.proxima.href}
              className="rounded-[3px] bg-fenix px-7 py-3.5 font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
            >
              {kitDaAcao.proxima.texto}
            </Link>
          )}
          <Link data-tour="cadastrar-vaga" href={NOVA_VAGA} className="text-osso underline-offset-4 hover:underline">
            Cadastrar outra vaga
          </Link>
        </div>
      </div>
    </section>
  );
}

// Uma linha por anel: a legenda que dá nome e número a cada kit.
function LinhaKit({
  tipo,
  posicao,
  kit,
  vagaId,
}: {
  tipo: TipoEntrevista;
  posicao: number;
  kit: ResumoKit | undefined;
  vagaId: string;
}) {
  const onde = ["fora", "meio", "dentro"][posicao];

  if (!kit) {
    return (
      <Link
        href={`${NOVA_VAGA}?vaga=${vagaId}&tipo=${tipo}`}
        className="group grid grid-cols-[5.5rem_1fr] items-baseline gap-4 py-3.5 text-cinza-quente transition-colors duration-200 hover:text-osso sm:grid-cols-[6.5rem_1fr_auto]"
      >
        <span className="text-rotulo">
          {NOME_CURTO[tipo]} <span className="sr-only">(anel de {onde})</span>
        </span>
        <span>
          <span className="font-medium">+ kit de {NOME_CURTO[tipo]}</span>
          <span className="block text-sm sm:inline sm:before:content-['_·_']">
            Mesma vaga, sem enviar nada de novo.
          </span>
        </span>
      </Link>
    );
  }

  const pct = pronto(kit);
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-4 gap-y-1 py-3.5 sm:grid-cols-[6.5rem_1fr_auto]">
      <span className="text-rotulo text-cinza-quente">
        {NOME_CURTO[tipo]} <span className="sr-only">(anel de {onde})</span>
      </span>
      <span className="flex flex-wrap items-baseline gap-x-3">
        {kit.total > 0 ? (
          <span className="font-display text-xl font-semibold tabular-nums">
            <span className={pct === 100 ? "text-menta" : undefined}>{pct}%</span>
            <span className="ml-2 font-app text-sm font-normal text-cinza-quente">pronto para o show</span>
          </span>
        ) : (
          <span className="text-sm text-cinza-quente">O mapa sai depois da conversa.</span>
        )}
        <span className="text-rotulo text-cinza-quente">
          {STATUS[kit.status]} · {kit.acesso}
        </span>
      </span>
      <Link
        href={kit.proxima.href}
        className="group relative col-start-2 justify-self-start text-sm text-osso sm:col-start-3"
      >
        {kit.proxima.texto} →
        <span
          aria-hidden
          className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-osso transition-transform duration-300 ease-brasa group-hover:scale-x-100"
        />
      </Link>
    </div>
  );
}

// As outras vagas, em anéis pequenos. Tocar traz a vaga para o foco.
function Faixa({ vagas, focoId, onFocar }: { vagas: ResumoVaga[]; focoId: string; onFocar: (id: string) => void }) {
  return (
    <section aria-labelledby="titulo-lista" className="mt-12">
      <h2 id="titulo-lista" className="text-rotulo text-cinza-quente">
        Suas vagas
      </h2>
      <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:overflow-visible sm:px-0">
        {vagas.map((vaga) => {
          const ativo = vaga.id === focoId;
          return (
            <li key={vaga.id} className="w-40 shrink-0 snap-start sm:w-auto">
              <button
                type="button"
                aria-pressed={ativo}
                onClick={() => {
                  onFocar(vaga.id);
                  if (window.scrollY > 200) window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`group flex h-full w-full flex-col items-start rounded-[3px] border p-4 text-left transition-colors duration-200 ${
                  ativo ? "border-osso" : "border-fio hover:border-cinza-quente"
                }`}
              >
                <span className="relative size-16">
                  <Aneis vaga={vaga} />
                  {ativo && <span aria-hidden className="absolute -top-1 -right-1 size-1.5 rounded-full bg-fenix" />}
                </span>
                <span className="mt-4 line-clamp-2 font-medium">{vaga.cargo ?? "Vaga sem cargo"}</span>
                {vaga.empresa && <span className="truncate text-sm text-cinza-quente">{vaga.empresa}</span>}
                <span className="mt-auto pt-3 text-rotulo tabular-nums text-cinza-quente">
                  Entrevista {entrevistaEm(vaga.dias)}
                </span>
                <span className="sr-only">{ativo ? "Em foco" : "Mostrar no topo"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Vazio({ nome }: { nome: string }) {
  const primeiro = nome.trim().split(/\s+/)[0];
  return (
    <section
      aria-labelledby="titulo-vazio"
      className="grid gap-10 border-b border-fio pb-14 sm:pt-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-center lg:gap-16"
    >
      <div
        aria-hidden
        data-tour="aneis"
        className="order-2 mx-auto aspect-square w-full max-w-[18rem] lg:order-1 lg:max-w-none"
      >
        <svg viewBox="0 0 100 100" className="block size-full">
          {[45, 34, 23].map((r) => (
            <circle
              key={r}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              strokeWidth="1"
              strokeDasharray="1.5 3"
              className="stroke-cinza-quente/60"
            />
          ))}
        </svg>
      </div>
      <div className="order-1 lg:order-2">
        <p className="text-rotulo text-cinza-quente">{primeiro ? `Currículo salvo, ${primeiro}` : "Currículo salvo"}</p>
        <h1 id="titulo-vazio" className="mt-3 max-w-[18ch] font-display text-display-lg font-medium text-balance">
          Agora, a vaga da sua próxima entrevista.
        </h1>
        <p className="mt-4 max-w-prose text-cinza-quente">
          Cole a descrição, veja seu diagnóstico e escolha o que preparar: RH, técnica ou liderança.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            data-tour="cadastrar-vaga"
            href={NOVA_VAGA}
            className="inline-block rounded-[3px] bg-fenix px-7 py-3.5 font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
          >
            Cadastrar vaga
          </Link>
          <Link href="/kits/demo/pratica" className="text-osso underline-offset-4 hover:underline">
            Ver um kit de demonstração
          </Link>
        </div>
      </div>
    </section>
  );
}

// O currículo é a base de todas as vagas; trocar não mexe nos kits já criados.
function SeuCurriculo({ curriculo }: { curriculo: CurriculoAtual }) {
  const { dados } = curriculo;
  const experiencias = dados.experiencias.length;
  const ultima = dados.experiencias[0];
  return (
    <section data-tour="curriculo" aria-labelledby="titulo-curriculo" className="mt-16 border-t border-fio pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
        <h2 id="titulo-curriculo" className="text-rotulo text-cinza-quente">
          Seu currículo
        </h2>
        <Link
          href="/comecar?atualizar=1"
          className="text-sm text-cinza-quente underline-offset-4 hover:text-osso hover:underline"
        >
          Atualizar currículo
        </Link>
      </div>
      <dl className="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-[1fr_auto_auto]">
        <div>
          <dt className="sr-only">Nome e título</dt>
          <dd className="font-display text-xl font-medium">{dados.nome.valor || "Sem nome"}</dd>
          {dados.titulo.valor && <dd className="text-cinza-quente">{dados.titulo.valor}</dd>}
        </div>
        {ultima && (
          <div>
            <dt className="text-rotulo text-cinza-quente">Mais recente</dt>
            <dd className="mt-1">{[ultima.cargo.valor, ultima.empresa.valor].filter(Boolean).join(" · ")}</dd>
          </div>
        )}
        <div>
          <dt className="text-rotulo text-cinza-quente">Atualizado em</dt>
          <dd className="mt-1 tabular-nums">
            {new Date(curriculo.criadoEm).toLocaleDateString("pt-BR")}
            <span className="text-cinza-quente">
              {" "}
              · {experiencias} {experiencias === 1 ? "experiência" : "experiências"}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
