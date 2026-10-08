import { ReguaSenioridade } from "@/components/preparacao/passo-diagnostico";
import { Regua } from "@/app/(app)/kits/[kitId]/mapa/_components/regua";
import { diagnosticoExemplo as d } from "@/lib/demo/preparacao";
import { demoItens } from "@/lib/hora-do-show/demo";
import { fala } from "@/lib/mapa/fala";

// As telas reais do app, com os dados do kit de demonstração, no tamanho da
// janela do Ensaio. Mesmos componentes e mesma linguagem do produto.

export type Tela = "diagnostico" | "mapa" | "pratica" | "show";

const ABA: Record<Tela, string> = {
  diagnostico: "Nova preparação",
  mapa: "Mapa",
  pratica: "Prática",
  show: "Hora do Show",
};

// Barra do app: a mesma navegação do kit, com a aba da tela atual.
export function BarraApp({ tela }: { tela: Tela }) {
  const abas = ["Conversa", "Mapa", "Prática", "Hora do Show"];
  return (
    <div className="flex h-11 items-center gap-5 border-b border-fio px-5 text-[0.8125rem]">
      <span className="font-display font-semibold">Phronix</span>
      {tela === "diagnostico" ? (
        <span className="text-cinza-quente">{ABA.diagnostico}</span>
      ) : (
        <span className="ml-auto flex gap-4">
          {abas.map((a) => (
            <span key={a} className={`relative ${a === ABA[tela] ? "text-osso" : "text-cinza-quente"}`}>
              {a}
              {a === ABA[tela] && <span className="absolute inset-x-0 -bottom-[15px] h-px bg-fenix" />}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

export function ConteudoDiagnostico() {
  return (
    <div className="p-7 sm:p-9">
      <p className="text-rotulo text-cinza-quente">Diagnóstico</p>
      <p className="mt-2 font-display text-3xl font-medium sm:text-4xl">Você está no nível pleno.</p>
      <ReguaSenioridade nivel="pleno" className="mt-12" />
      <div className="mt-10 grid gap-8 border-t border-fio pt-6 sm:grid-cols-[auto_1fr_1fr]">
        <p className="font-display text-5xl font-semibold tabular-nums">
          {d.match}
          <span className="text-base font-normal text-cinza-quente">/100</span>
        </p>
        <Lista titulo="Pontos fortes" itens={d.fortes.slice(0, 2)} />
        <Lista titulo="Lacunas" itens={d.lacunas.slice(0, 2)} suave />
      </div>
    </div>
  );
}

function Lista({ titulo, itens, suave = false }: { titulo: string; itens: string[]; suave?: boolean }) {
  return (
    <div>
      <p className="text-rotulo text-cinza-quente">{titulo}</p>
      <ul className="mt-2 space-y-1.5 text-sm">
        {itens.map((i) => (
          <li key={i} className={`flex gap-2 ${suave ? "text-cinza-quente" : ""}`}>
            <span
              aria-hidden
              className={`mt-[0.55em] size-1.5 shrink-0 rounded-full ${suave ? "border border-cinza-quente" : "bg-osso"}`}
            />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

const CASE = demoItens.find((i) => i.categoria === "experiencia_cases")!;
const INDICE = demoItens.filter((i) => i.gancho).slice(0, 6);

export function ConteudoMapa() {
  return (
    <div className="grid h-full sm:grid-cols-[13rem_1fr]">
      <ul className="hidden border-r border-fio py-5 text-[0.8125rem] sm:block">
        {INDICE.map((i) => {
          const atual = i.id === CASE.id;
          return (
            <li
              key={i.id}
              className={`relative flex gap-2 px-4 py-2 ${atual ? "bg-grafite text-osso" : "text-osso/70"}`}
            >
              {atual && <span className="absolute inset-y-2 left-0 w-0.5 bg-fenix" />}
              <span className="line-clamp-1 flex-1">{i.pergunta}</span>
              <span className="tabular-nums text-cinza-quente">{fala(i).segundos} s</span>
            </li>
          );
        })}
      </ul>
      <div className="p-7">
        <p className="font-display text-2xl font-medium text-balance">{CASE.pergunta}</p>
        <div className="mt-6">
          <Regua {...fala(CASE)} />
        </div>
        <p className="mt-7 text-lg font-medium text-pretty">{CASE.gancho}</p>
        <p className="mt-4 flex gap-4 font-medium">
          {CASE.ancoras.map((a) => (
            <span key={a}>{a}</span>
          ))}
          <span className="ml-auto text-fenix tabular-nums">{CASE.numero_impacto}</span>
        </p>
      </div>
    </div>
  );
}

// Distribuição do histórico de exemplo. Um ponto viaja da caixa 1 ao Palco
// conforme a rolagem (variável --pratica, de 0 a 1, no elemento pai).
const COLUNAS = [
  { nome: "Caixa 1", pontos: 1 },
  { nome: "Caixa 2", pontos: 3 },
  { nome: "Caixa 3", pontos: 2 },
  { nome: "Caixa 4", pontos: 2 },
  { nome: "Palco", pontos: 3 },
];

export function ConteudoPratica({ estatico = false }: { estatico?: boolean }) {
  return (
    <div className="p-7 sm:p-9">
      <p className="text-rotulo text-cinza-quente">Pronto para o show</p>
      <p className="mt-1 font-display text-6xl font-semibold tabular-nums">25%</p>
      <div className="relative mt-10">
        <ol className="grid grid-cols-5 border-y border-fio">
          {COLUNAS.map((c) => (
            <li key={c.nome} className="min-h-32 border-l border-fio px-3 py-4 first:border-l-0">
              <p className={`text-rotulo ${c.nome === "Palco" ? "text-menta" : "text-cinza-quente"}`}>{c.nome}</p>
              <p className="mt-5 flex flex-wrap gap-2">
                {Array.from({ length: c.pontos }, (_, i) => (
                  <span
                    key={i}
                    className={`size-3.5 rounded-full ${
                      c.nome === "Palco" ? "bg-menta" : c.nome === "Caixa 4" ? "border border-cinza-quente" : "bg-osso"
                    }`}
                  />
                ))}
              </p>
            </li>
          ))}
        </ol>
        {!estatico && (
          // O ponto que anda: sai da caixa 1 e chega ao Palco, virando Menta.
          <span
            aria-hidden
            className="pointer-events-none absolute top-[3.4rem] left-[calc(10%-0.4375rem)]"
            style={{ transform: "translateX(calc(var(--pratica, 0) * 400%))", width: "20%" }}
          >
            <span className="relative block size-3.5">
              <span className="absolute inset-0 rounded-full bg-osso shadow-[0_0_18px_rgb(242_239_232/0.5)]" />
              <span
                className="absolute inset-0 rounded-full bg-menta shadow-[0_0_22px_rgb(61_220_151/0.6)]"
                style={{ opacity: "clamp(0, calc((var(--pratica, 0) - 0.85) * 7), 1)" }}
              />
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

export function ConteudoShow() {
  return (
    <div className="relative grid h-full bg-palco font-show sm:grid-cols-[1fr_11rem]">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-fio" />
      <div className="p-7 sm:p-9">
        <p className="text-hs-pergunta text-cinza-quente">{CASE.pergunta}</p>
        <p className="mt-2 text-hs-gancho font-bold text-pretty">{CASE.gancho}</p>
        <p className="mt-4 flex flex-wrap items-baseline gap-x-4 text-hs-ancora font-semibold">
          {CASE.ancoras.map((a) => (
            <span key={a}>{a}</span>
          ))}
          <span className="ml-auto text-fenix tabular-nums">{CASE.numero_impacto}</span>
        </p>
      </div>
      <ul className="hidden border-l border-fio py-5 text-[0.8125rem] text-osso/75 sm:block">
        {INDICE.slice(0, 5).map((i) => (
          <li key={i.id} className={`relative px-4 py-1.5 ${i.id === CASE.id ? "font-semibold text-osso" : ""}`}>
            {i.id === CASE.id && <span className="absolute inset-y-1.5 left-0 w-0.5 bg-fenix" />}
            <span className="line-clamp-1">{i.pergunta}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
