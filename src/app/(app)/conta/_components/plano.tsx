"use client";

import { useState } from "react";
import { PLANOS, VALIDADE_AVULSO_DIAS, type PlanoId } from "@/lib/planos";

const DIA = 86_400_000;

function data(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// Plano atual (do perfil) + comparação. Pagamento ainda não está ligado.
// avulsoAte: validade do kit avulso mais recente, quando houver.
export function Plano({ plano, avulsoAte }: { plano: PlanoId; avulsoAte: string | null }) {
  const [aviso, setAviso] = useState<PlanoId | null>(null);
  const [agora] = useState(() => new Date());
  const visao: PlanoId = plano === "gratis" && avulsoAte ? "avulso" : plano;
  const nome = PLANOS.find((p) => p.id === visao)?.nome ?? "Grátis";

  return (
    <div>
      <div className="animate-revelar">
        <p className="font-display text-display-lg font-medium">{nome}</p>
        {visao === "gratis" && (
          <>
            <p className="mt-2 text-cinza-quente">{PLANOS[0].inclui}.</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button
                type="button"
                aria-disabled
                onClick={() => setAviso("avulso")}
                className="rounded-[3px] bg-fenix px-6 py-3 font-semibold text-noite shadow-fenix focus-visible:outline-osso"
              >
                Liberar o kit completo · R$ 24
              </button>
              {aviso === "avulso" && (
                <span role="status" className="text-sm text-cinza-quente">
                  Pagamento em breve.
                </span>
              )}
            </div>
          </>
        )}
        {visao === "avulso" && avulsoAte && (
          <Validade compra={new Date(new Date(avulsoAte).getTime() - VALIDADE_AVULSO_DIAS * DIA)} agora={agora} />
        )}
        {(visao === "pro_mensal" || visao === "pro_trimestral") && (
          <p className="mt-2 text-cinza-quente">Kits ilimitados com uso justo.</p>
        )}
      </div>

      <h3 className="mt-14 text-rotulo text-cinza-quente">Planos</h3>
      <table className="mt-3 w-full border-collapse text-left">
        <caption className="sr-only">Comparação dos planos</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Plano</th>
            <th scope="col">Inclui</th>
            <th scope="col">Preço</th>
            <th scope="col">Ação</th>
          </tr>
        </thead>
        <tbody>
          {PLANOS.map((p) => {
            const atual = p.id === visao;
            return (
              <tr key={p.id} className="border-t border-fio last:border-b max-sm:flex max-sm:flex-col max-sm:py-4">
                <th scope="row" className="py-5 pr-6 align-top font-medium max-sm:py-0 sm:w-40">
                  {p.nome}
                  {atual && <span className="mt-1 block text-rotulo font-normal text-osso">Seu plano</span>}
                </th>
                <td className="py-5 pr-6 align-top text-cinza-quente max-sm:py-1">{p.inclui}</td>
                <td className="py-5 pr-6 align-top whitespace-nowrap max-sm:py-1 sm:text-right">
                  <span className="font-display text-xl font-medium tabular-nums">{p.preco}</span>
                  {p.periodo && <span className="text-sm text-cinza-quente">{p.periodo}</span>}
                  {p.nota && <span className="block text-rotulo text-cinza-quente">{p.nota}</span>}
                </td>
                <td className="py-5 align-top max-sm:pt-3 sm:w-36 sm:text-right">
                  {!atual && p.id !== "gratis" && (
                    <>
                      <button
                        type="button"
                        aria-disabled
                        onClick={() => setAviso(p.id)}
                        className="rounded-[3px] border border-fio px-3 py-1.5 text-sm hover:border-cinza-quente"
                      >
                        Escolher
                      </button>
                      {aviso === p.id && (
                        <span role="status" className="mt-1.5 block text-rotulo text-cinza-quente">
                          Pagamento em breve.
                        </span>
                      )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-rotulo text-cinza-quente">Preços de teste do beta.</p>
    </div>
  );
}

// O momento da tela: o fio da validade encolhe ao longo dos 30 dias.
function Validade({ compra, agora }: { compra: Date; agora: Date }) {
  const fim = new Date(compra.getTime() + VALIDADE_AVULSO_DIAS * DIA);
  const restantes = Math.max(0, Math.ceil((fim.getTime() - agora.getTime()) / DIA));
  const fracao = restantes / VALIDADE_AVULSO_DIAS;
  const acabando = restantes <= 3;

  return (
    <>
      <p className={`mt-2 ${acabando ? "text-ambar" : "text-cinza-quente"}`}>
        {restantes === 0 ? "Venceu." : `Faltam ${restantes} ${restantes === 1 ? "dia" : "dias"}.`}{" "}
        <span className="text-osso">Vale até {data(fim)}.</span>
      </p>
      <div className="mt-10 max-w-xl" aria-hidden>
        <div className="relative h-3">
          <div className="absolute inset-x-0 top-1/2 h-px bg-fio" />
          {/* Trecho que ainda resta, de hoje até o vencimento. */}
          <div
            className={`absolute top-1/2 h-px ${
              acabando ? "bg-ambar" : "bg-osso"
            }`}
            style={{ left: `${(1 - fracao) * 100}%`, width: `${fracao * 100}%` }}
          />
          <span
            className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              acabando ? "bg-ambar" : "bg-osso"
            }`}
            style={{ left: `${(1 - fracao) * 100}%` }}
          />
          <span
            className="absolute -top-5 -translate-x-1/2 text-rotulo text-osso"
            style={{ left: `${(1 - fracao) * 100}%` }}
          >
            hoje
          </span>
        </div>
        <div className="mt-2 flex justify-between text-rotulo text-cinza-quente">
          <span>comprado em {data(compra)}</span>
          <span>vence {data(fim)}</span>
        </div>
      </div>
    </>
  );
}
