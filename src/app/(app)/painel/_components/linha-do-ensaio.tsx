"use client";

import { useEffect, useState } from "react";
import type { TipoEntrevista } from "@/lib/domain";
import type { Sessao } from "@/lib/pratica/metricas";
import { dataCurta, dataLocal } from "@/lib/pratica/formatos";

const DIA = 86_400_000;
const PASSADO = 14;
const FUTURO_MINIMO = 21;
const FUTURO_MAXIMO = 90;
const ALTURA_BARRA = 64;

const CURTO: Record<TipoEntrevista, string> = { rh: "RH", tecnica: "Técnica", lideranca: "Liderança" };

export type MarcoEntrevista = { kitId: string; tipo: TipoEntrevista; data: string; empresa: string | null };

function inicioDoDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// O elemento da tela: duas semanas de prática à esquerda do "hoje", as
// entrevistas marcadas à direita. Cada dia praticado é uma barra empilhada
// (Menta acertos, Osso quase, Âmbar erros), com altura pelo número de
// respostas. Depende do relógio e do fuso do aparelho, por isso só desenha
// depois de montar no navegador.
export function LinhaDoEnsaio({ sessoes, entrevistas }: { sessoes: Sessao[]; entrevistas: MarcoEntrevista[] }) {
  const [hoje, setHoje] = useState<Date | null>(null);
  useEffect(() => {
    // Relógio do aparelho: só existe no navegador.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHoje(inicioDoDia(new Date()));
  }, []);

  if (!hoje) return <div aria-hidden className="h-44" />;

  const inicio = hoje.getTime() - PASSADO * DIA;
  // Entrevistas do mesmo dia viram um marco só ("RH e Técnica").
  const porData = new Map<number, { kitId: string; tipos: TipoEntrevista[]; quando: Date }>();
  for (const e of entrevistas) {
    const quando = dataLocal(e.data);
    if (quando.getTime() < inicio) continue;
    const marco = porData.get(quando.getTime());
    if (marco) marco.tipos.push(e.tipo);
    else porData.set(quando.getTime(), { kitId: e.kitId, tipos: [e.tipo], quando });
  }
  const futuras = [...porData.values()]
    .sort((a, b) => a.quando.getTime() - b.quando.getTime())
    .map((m) => ({ ...m, nome: m.tipos.map((t) => CURTO[t]).join(" e ") }));
  const ultima = Math.max(0, ...futuras.map((e) => (e.quando.getTime() - hoje.getTime()) / DIA));
  const fim = hoje.getTime() + Math.min(FUTURO_MAXIMO, Math.max(FUTURO_MINIMO, ultima + 3)) * DIA;
  const x = (t: number) => ((t - inicio) / (fim - inicio)) * 100;

  // Sessões somadas por dia.
  const porDia = new Map<number, { acertos: number; quase: number; erros: number }>();
  for (const s of sessoes) {
    const dia = inicioDoDia(new Date(s.inicio)).getTime();
    if (dia < inicio) continue;
    const atual = porDia.get(dia) ?? { acertos: 0, quase: 0, erros: 0 };
    atual.acertos += s.acertos;
    atual.quase += s.quase;
    atual.erros += s.erros;
    porDia.set(dia, atual);
  }
  const maior = Math.max(6, ...[...porDia.values()].map((d) => d.acertos + d.quase + d.erros));
  const largura = Math.max(0.6, 70 / ((fim - inicio) / DIA));

  const praticados = porDia.size;
  const descricao = [
    praticados
      ? `Você praticou em ${praticados} ${praticados === 1 ? "dia" : "dias"} nas últimas duas semanas.`
      : "Nenhuma prática nas últimas duas semanas.",
    futuras.length
      ? `Entrevistas marcadas: ${futuras.map((e) => `${e.nome} em ${dataCurta(e.quando, hoje)}`).join(", ")}.`
      : "Nenhuma entrevista marcada.",
  ].join(" ");

  return (
    <figure className="m-0">
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div role="img" aria-label={descricao} className="relative h-44 min-w-[40rem]">
          {/* Eixo do tempo */}
          <span aria-hidden className="absolute inset-x-0 top-[84px] h-px bg-fio" />

          {/* Prática: barras acima do eixo */}
          {[...porDia.entries()].map(([dia, d]) => {
            const total = d.acertos + d.quase + d.erros;
            const altura = Math.max(6, (total / maior) * ALTURA_BARRA);
            return (
              <span
                key={dia}
                aria-hidden
                className="absolute bottom-[calc(100%-84px)] flex -translate-x-1/2 flex-col-reverse overflow-hidden rounded-t-[2px]"
                style={{ left: `${x(dia + DIA / 2)}%`, width: `${largura}%`, height: altura }}
              >
                <span className="bg-menta" style={{ flexGrow: d.acertos }} />
                <span className="bg-osso/70" style={{ flexGrow: d.quase }} />
                <span className="bg-ambar" style={{ flexGrow: d.erros }} />
              </span>
            );
          })}

          {/* Hoje */}
          <span
            aria-hidden
            className="absolute top-3 bottom-8 w-px bg-osso"
            style={{ left: `${x(hoje.getTime())}%` }}
          />
          <span
            aria-hidden
            className="absolute top-0 -translate-x-1/2 text-rotulo text-osso"
            style={{ left: `${x(hoje.getTime())}%` }}
          >
            Hoje
          </span>

          {/* Entrevistas: marcos abaixo do eixo, em duas alturas para não colidir */}
          {futuras.map((e, i) => {
            const passou = e.quando.getTime() < hoje.getTime();
            return (
              <span
                key={e.kitId}
                aria-hidden
                className="absolute flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${x(e.quando.getTime() + DIA / 2)}%`, top: 78 }}
              >
                <span
                  className={`size-3 rounded-full border-2 ${passou ? "border-cinza-quente bg-noite" : "border-fenix bg-noite"}`}
                />
                <span
                  className={`mt-1 h-3 w-px ${i % 2 ? "h-8" : ""} ${passou ? "bg-cinza-quente/50" : "bg-fenix/60"}`}
                />
                <span
                  className={`text-center text-sm leading-tight whitespace-nowrap ${passou ? "text-cinza-quente" : "text-osso"}`}
                >
                  {e.nome}
                  <span className="block text-rotulo text-cinza-quente">{dataCurta(e.quando, hoje)}</span>
                </span>
              </span>
            );
          })}

          {/* Bordas do período */}
          <span aria-hidden className="absolute top-[92px] left-0 text-rotulo text-cinza-quente">
            {dataCurta(new Date(inicio), hoje)}
          </span>

          {/* Linha vazia: diz o que vai aparecer, em vez de ficar muda. */}
          {!praticados && !futuras.length && (
            <p className="absolute top-[30px] right-0 max-w-[24rem] text-right text-sm text-cinza-quente">
              Cada dia de prática vira uma barra aqui, e cada entrevista com data, um marco depois do hoje.
            </p>
          )}
        </div>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-rotulo text-cinza-quente">
        <Legenda cor="bg-menta">Acertos</Legenda>
        <Legenda cor="bg-osso/70">Quase</Legenda>
        <Legenda cor="bg-ambar">Erros</Legenda>
        <Legenda cor="border-2 border-fenix" redondo>
          Entrevista marcada
        </Legenda>
      </figcaption>
    </figure>
  );
}

function Legenda({ cor, redondo = false, children }: { cor: string; redondo?: boolean; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className={`size-2.5 ${redondo ? "rounded-full" : "rounded-[1px]"} ${cor}`} />
      {children}
    </span>
  );
}
