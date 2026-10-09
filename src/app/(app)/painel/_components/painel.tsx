"use client";

/*
 * Painel na direção "Agenda de ensaio" (herda a Trilha e a paleta Brasa).
 * - Abre com uma frase que responde "o que vem agora?" e, logo abaixo, as
 *   três portas do app: Elaborar entrevista, Praticar e Hora do Show. A porta
 *   recomendada no momento é a única em Fênix.
 * - O elemento da tela é a linha do ensaio: prática das últimas duas semanas à
 *   esquerda do "hoje", entrevistas marcadas à direita.
 * - O resto é quieto: próximas entrevistas com atalhos, como foi a prática,
 *   entrevistas já realizadas e o currículo.
 */

import Link from "next/link";
import type { TipoEntrevista } from "@/lib/domain";
import { Anel } from "@/components/painel/anel";
import type { MetricasPratica, Sessao } from "@/lib/pratica/metricas";
import { dataCurta, dataLocal, entrevistaEm } from "@/lib/pratica/formatos";
import type { CurriculoAtual } from "@/lib/preparacao/curriculo";
import type { ResumoKit, ResumoVaga } from "@/lib/preparacao/listar";
import { LinhaDoEnsaio } from "./linha-do-ensaio";

const ORDEM: TipoEntrevista[] = ["rh", "tecnica", "lideranca"];
const NOME: Record<TipoEntrevista, string> = {
  rh: "Entrevista de RH",
  tecnica: "Entrevista técnica",
  lideranca: "Entrevista de liderança",
};
const NA_FRASE: Record<TipoEntrevista, string> = {
  rh: "de RH",
  tecnica: "técnica",
  lideranca: "de liderança",
};
const STATUS: Record<ResumoKit["status"], string> = {
  rascunho: "Rascunho",
  diagnosticado: "Pronta para a conversa",
  garimpo: "Na conversa dos casos",
  pronto: "Mapa pronto",
};

type Entrevista = { kit: ResumoKit; tipo: TipoEntrevista; vaga: ResumoVaga };

function pct(kit: ResumoKit) {
  return kit.total ? Math.round((kit.prontas / kit.total) * 100) : 0;
}

function onde(vaga: ResumoVaga) {
  return [vaga.cargo ?? "Vaga sem cargo", vaga.empresa].filter(Boolean).join(", ");
}

export function Painel({
  nome,
  vagas,
  curriculo,
  metricas,
}: {
  nome: string | null;
  vagas: ResumoVaga[];
  curriculo: CurriculoAtual | null;
  metricas: MetricasPratica;
}) {
  const entrevistas: Entrevista[] = vagas.flatMap((vaga) =>
    ORDEM.flatMap((tipo) => (vaga.kits[tipo] ? [{ kit: vaga.kits[tipo], tipo, vaga }] : [])),
  );
  const proximas = entrevistas.filter((e) => e.vaga.dias === null || e.vaga.dias >= 0);
  const realizadas = entrevistas.filter((e) => e.vaga.dias !== null && e.vaga.dias < 0);
  const comMapa = entrevistas.filter((e) => e.kit.total > 0);
  const aRevisar = comMapa.reduce((s, e) => s + e.kit.aRevisar, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
      <Abertura nome={nome} proximas={proximas} />
      <Portas
        temEntrevista={entrevistas.length > 0}
        temCurriculo={curriculo !== null}
        comMapa={comMapa.length}
        aRevisar={aRevisar}
        showHoje={proximas.some((e) => e.kit.total > 0 && e.vaga.dias !== null && e.vaga.dias <= 1)}
      />

      <section data-tour="linha-do-ensaio" aria-labelledby="titulo-linha" className="mt-16">
        <h2 id="titulo-linha" className="font-display text-xl font-medium">
          Sua linha do ensaio
        </h2>
        <p className="mt-1 max-w-prose text-sm text-cinza-quente">
          A prática das últimas duas semanas e as entrevistas que estão por vir.
        </p>
        <div className="mt-8">
          <LinhaDoEnsaio
            sessoes={metricas.recentes}
            entrevistas={entrevistas.flatMap((e) =>
              e.vaga.data ? [{ kitId: e.kit.id, tipo: e.tipo, data: e.vaga.data, empresa: e.vaga.empresa }] : [],
            )}
          />
        </div>
      </section>

      <div className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
        <ProximasEntrevistas entrevistas={proximas} />
        <ComoFoi metricas={metricas} entrevistas={entrevistas} />
      </div>

      {realizadas.length > 0 && <Realizadas entrevistas={realizadas} />}
      <SeuCurriculo curriculo={curriculo} />
    </main>
  );
}

function Abertura({ nome, proximas }: { nome: string | null; proximas: Entrevista[] }) {
  const primeiro = nome?.trim().split(/\s+/)[0];
  const marcada = proximas.find((e) => e.vaga.dias !== null);
  let titulo: string;
  let apoio: string;

  if (!proximas.length) {
    titulo = "Sua próxima entrevista começa aqui.";
    apoio =
      "Elabore a partir da vaga: a IA lê seu currículo, encontra seus casos e monta respostas curtas para você ensaiar.";
  } else if (!marcada) {
    titulo = "Nenhuma entrevista com data marcada.";
    apoio = "Com a data, a prática se organiza sozinha até o dia. Enquanto isso, praticar um pouco por dia já ajuda.";
  } else {
    const { dias } = marcada.vaga;
    const qual = `entrevista ${NA_FRASE[marcada.tipo]}${marcada.vaga.empresa ? ` na ${marcada.vaga.empresa}` : ""}`;
    titulo =
      dias === 0 ? `Sua ${qual} é hoje.` : dias === 1 ? `Sua ${qual} é amanhã.` : `Faltam ${dias} dias para a ${qual}.`;
    apoio =
      marcada.kit.total > 0
        ? `${pct(marcada.kit)}% das respostas já estão no Palco.`
        : "O mapa de respostas sai depois da conversa dos casos.";
  }

  return (
    <header>
      {primeiro && <p className="text-cinza-quente">Olá, {primeiro}.</p>}
      <h1 className="mt-2 max-w-[22ch] font-display text-display-lg font-medium text-balance">{titulo}</h1>
      <p className="mt-3 max-w-prose text-cinza-quente">{apoio}</p>
    </header>
  );
}

// As três portas do app. A recomendada para agora é a única em Fênix.
function Portas({
  temEntrevista,
  temCurriculo,
  comMapa,
  aRevisar,
  showHoje,
}: {
  temEntrevista: boolean;
  temCurriculo: boolean;
  comMapa: number;
  aRevisar: number;
  showHoje: boolean;
}) {
  const recomendada = !temEntrevista ? "elaborar" : showHoje ? "show" : comMapa ? "praticar" : "elaborar";
  const portas = [
    {
      id: "elaborar",
      titulo: "Elaborar entrevista",
      texto: temCurriculo
        ? "Cole a vaga e a IA monta suas respostas a partir dos seus casos."
        : "Envie o currículo e cole a vaga. A IA monta suas respostas.",
      href: "/elaborar",
    },
    {
      id: "praticar",
      titulo: "Praticar",
      texto: !comMapa
        ? "Fica disponível quando a primeira entrevista tiver mapa."
        : aRevisar
          ? `${aRevisar} ${aRevisar === 1 ? "resposta esperando" : "respostas esperando"} revisão.`
          : "Tudo em dia. Uma rodada rápida mantém a memória fresca.",
      href: "/pratica",
    },
    {
      id: "show",
      titulo: "Hora do Show",
      texto: comMapa
        ? `Consulte as respostas ao vivo. ${comMapa} ${comMapa === 1 ? "entrevista pronta" : "entrevistas prontas"}.`
        : "Para consultar ao vivo, durante a entrevista.",
      href: "/hora-do-show",
    },
  ];

  return (
    <nav
      aria-label="O que fazer agora"
      className="mt-10 grid border-y border-fio md:grid-cols-3 md:divide-x md:divide-fio max-md:divide-y max-md:divide-fio"
    >
      {portas.map((p) => {
        const destaque = p.id === recomendada;
        return (
          <Link
            key={p.id}
            href={p.href}
            data-tour={`porta-${p.id}`}
            className={`group flex flex-col justify-between gap-6 px-5 py-6 transition-colors duration-200 md:min-h-44 md:px-6 ${
              destaque ? "bg-fenix text-noite" : "hover:bg-grafite"
            }`}
          >
            <span className="font-display text-2xl font-medium sm:text-3xl">{p.titulo}</span>
            <span className={`text-sm ${destaque ? "text-noite/80" : "text-cinza-quente"}`}>
              {p.texto}
              {destaque && <span className="mt-2 block font-semibold text-noite">Recomendado agora</span>}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function ProximasEntrevistas({ entrevistas }: { entrevistas: Entrevista[] }) {
  return (
    <section data-tour="proximas" aria-labelledby="titulo-proximas">
      <h2 id="titulo-proximas" className="font-display text-xl font-medium">
        Próximas entrevistas
      </h2>
      {entrevistas.length === 0 ? (
        <p className="mt-4 max-w-prose text-cinza-quente">
          Nenhuma ainda. Quando você elaborar uma entrevista, ela aparece aqui com a data e o quanto você já está
          pronto.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-fio border-y border-fio">
          {entrevistas.map((e) => (
            <LinhaEntrevista key={e.kit.id} entrevista={e} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LinhaEntrevista({ entrevista: { kit, tipo, vaga } }: { entrevista: Entrevista }) {
  const comMapa = kit.total > 0;
  const data = vaga.data ? dataLocal(vaga.data) : null;
  const atalhos = [
    { nome: "Continuar a conversa", href: `/kits/${kit.id}/conversa?tipo=${tipo}`, ok: !comMapa },
    { nome: "Praticar", href: `/kits/${kit.id}/pratica`, ok: comMapa },
    { nome: "Mapa", href: `/kits/${kit.id}/mapa`, ok: comMapa },
    { nome: "Hora do Show", href: `/hora-do-show/${kit.id}`, ok: comMapa },
  ].filter((a) => a.ok);

  return (
    <li className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 py-5 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:items-center">
      <div className="text-center" suppressHydrationWarning>
        {data ? (
          <>
            <span className="block font-display text-3xl leading-none font-semibold tabular-nums">
              {data.getDate()}
            </span>
            <span className="text-rotulo text-cinza-quente">{dataCurta(data).split(" ").slice(1).join(" ")}</span>
          </>
        ) : (
          <span className="text-rotulo text-cinza-quente">sem data</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-medium">{NOME[tipo]}</p>
        <p className="truncate text-sm text-cinza-quente">{onde(vaga)}</p>
        <p className="mt-1 flex items-center gap-2 text-sm">
          <Anel pct={pct(kit)} comMapa={comMapa} className="size-4" />
          {comMapa ? (
            <span>
              <span className={`tabular-nums ${pct(kit) === 100 ? "text-menta" : ""}`}>{pct(kit)}%</span>{" "}
              <span className="text-cinza-quente">pronto, entrevista {entrevistaEm(vaga.dias)}</span>
            </span>
          ) : (
            <span className="text-cinza-quente">{STATUS[kit.status]}</span>
          )}
        </p>
      </div>
      <nav
        aria-label={`Atalhos da ${NOME[tipo].toLowerCase()}, ${onde(vaga)}`}
        className="col-start-2 flex flex-wrap gap-2 sm:col-start-3 sm:justify-end"
      >
        {atalhos.map((a, i) => (
          <Link
            key={a.nome}
            href={a.href}
            className={`rounded-[3px] border px-3 py-1.5 text-sm transition-colors duration-150 ${
              i === 0
                ? "border-osso text-osso"
                : "border-fio text-cinza-quente hover:border-cinza-quente hover:text-osso"
            }`}
          >
            {a.nome}
          </Link>
        ))}
      </nav>
    </li>
  );
}

function ComoFoi({ metricas, entrevistas }: { metricas: MetricasPratica; entrevistas: Entrevista[] }) {
  const respondidas = metricas.acertos + metricas.quase + metricas.erros;
  const taxa = respondidas ? Math.round((metricas.acertos / respondidas) * 100) : null;
  const porKit = new Map(entrevistas.map((e) => [e.kit.id, e]));
  const ultimas = [...metricas.recentes].reverse().slice(0, 5);

  const numeros = [
    { rotulo: "Vezes que praticou", valor: metricas.sessoes, cor: "" },
    { rotulo: "Acertos", valor: metricas.acertos, cor: metricas.acertos ? "text-menta" : "" },
    { rotulo: "Quase", valor: metricas.quase, cor: "" },
    { rotulo: "Erros", valor: metricas.erros, cor: metricas.erros ? "text-ambar" : "" },
  ];

  return (
    <section data-tour="pratica" aria-labelledby="titulo-como-foi">
      <h2 id="titulo-como-foi" className="font-display text-xl font-medium">
        Como foi a prática
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-fio pt-5">
        {numeros.map((n) => (
          <div key={n.rotulo}>
            <dt className="text-sm text-cinza-quente">{n.rotulo}</dt>
            <dd className={`mt-1 font-display text-3xl font-semibold tabular-nums ${n.cor}`}>{n.valor}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-cinza-quente">
        {taxa === null
          ? "Os números aparecem depois da primeira rodada de prática."
          : `${taxa}% de acerto em ${respondidas} ${respondidas === 1 ? "resposta" : "respostas"}.`}
      </p>

      {ultimas.length > 0 && (
        <>
          <h3 className="mt-8 text-sm text-cinza-quente">Últimas rodadas</h3>
          <ul className="mt-2 divide-y divide-fio border-y border-fio">
            {ultimas.map((s) => (
              <RodadaDePratica key={`${s.kitId}-${s.inicio}`} sessao={s} entrevista={porKit.get(s.kitId)} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function RodadaDePratica({ sessao, entrevista }: { sessao: Sessao; entrevista?: Entrevista }) {
  const total = sessao.acertos + sessao.quase + sessao.erros || 1;
  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-4">
        <p className="min-w-0 truncate text-sm">
          {entrevista ? NOME[entrevista.tipo] : "Entrevista"}
          {entrevista?.vaga.empresa && <span className="text-cinza-quente">, {entrevista.vaga.empresa}</span>}
        </p>
        <p suppressHydrationWarning className="shrink-0 text-rotulo text-cinza-quente">
          {dataCurta(new Date(sessao.inicio))}
        </p>
      </div>
      <div aria-hidden className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-fio">
        <span className="bg-menta" style={{ width: `${(sessao.acertos / total) * 100}%` }} />
        <span className="bg-osso/70" style={{ width: `${(sessao.quase / total) * 100}%` }} />
        <span className="bg-ambar" style={{ width: `${(sessao.erros / total) * 100}%` }} />
      </div>
      <p className="mt-1.5 text-rotulo text-cinza-quente">
        {sessao.acertos} {sessao.acertos === 1 ? "acerto" : "acertos"}, {sessao.quase} quase, {sessao.erros}{" "}
        {sessao.erros === 1 ? "erro" : "erros"}
      </p>
    </li>
  );
}

function Realizadas({ entrevistas }: { entrevistas: Entrevista[] }) {
  return (
    <section aria-labelledby="titulo-realizadas" className="mt-16">
      <h2 id="titulo-realizadas" className="font-display text-xl font-medium">
        Entrevistas que você já fez{" "}
        <span className="font-app text-base font-normal text-cinza-quente tabular-nums">({entrevistas.length})</span>
      </h2>
      <ul className="mt-4 grid gap-x-10 border-t border-fio sm:grid-cols-2">
        {entrevistas.map(({ kit, tipo, vaga }) => (
          <li key={kit.id} className="flex items-center justify-between gap-4 border-b border-fio py-3">
            <span className="min-w-0">
              <span className="block truncate text-sm">{NOME[tipo]}</span>
              <span className="block truncate text-rotulo text-cinza-quente">{onde(vaga)}</span>
            </span>
            <span suppressHydrationWarning className="shrink-0 text-rotulo text-cinza-quente">
              {vaga.data ? dataCurta(dataLocal(vaga.data)) : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// O currículo é lido aqui dentro, com a conta criada; trocar não mexe nas
// entrevistas já elaboradas.
function SeuCurriculo({ curriculo }: { curriculo: CurriculoAtual | null }) {
  const recente = curriculo?.dados.experiencias[0];
  return (
    <section data-tour="curriculo" aria-labelledby="titulo-curriculo" className="mt-16 border-t border-fio pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
        <h2 id="titulo-curriculo" className="font-display text-xl font-medium">
          Seu currículo
        </h2>
        <Link
          href="/curriculo"
          className="text-sm text-cinza-quente underline-offset-4 hover:text-osso hover:underline"
        >
          {curriculo ? "Trocar currículo" : "Enviar currículo"}
        </Link>
      </div>
      {curriculo ? (
        <dl className="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <dt className="sr-only">Nome e título</dt>
            <dd className="font-medium">{curriculo.dados.nome.valor || "Sem nome"}</dd>
            {curriculo.dados.titulo.valor && <dd className="text-cinza-quente">{curriculo.dados.titulo.valor}</dd>}
          </div>
          {recente && (
            <div>
              <dt className="text-sm text-cinza-quente">Mais recente</dt>
              <dd className="mt-1">{[recente.cargo.valor, recente.empresa.valor].filter(Boolean).join(", ")}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-cinza-quente">Salvo em</dt>
            <dd suppressHydrationWarning className="mt-1 tabular-nums">
              {new Date(curriculo.criadoEm).toLocaleDateString("pt-BR")}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 max-w-prose text-cinza-quente">
          Ainda não enviado. Ele é lido quando você elabora a primeira entrevista, ou agora mesmo, se preferir.
        </p>
      )}
    </section>
  );
}
