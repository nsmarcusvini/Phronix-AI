import Link from "next/link";
import type { TipoEntrevista } from "@/lib/domain";
import { NOME_TIPO } from "@/lib/hora-do-show/categorias";
import { entrevistaEm } from "@/lib/pratica/formatos";
import type { ResumoKit, ResumoVaga } from "@/lib/preparacao/listar";

const ORDEM: TipoEntrevista[] = ["rh", "tecnica", "lideranca"];

const STATUS: Record<ResumoKit["status"], string> = {
  rascunho: "Rascunho",
  diagnosticado: "Diagnosticado",
  garimpo: "Na conversa",
  pronto: "Mapa pronto",
};

// Todas as entrevistas (um kit = uma entrevista), da mais próxima para a mais
// distante, com atalho direto para cada tela. Telas que dependem do mapa só
// aparecem quando ele existe.
export function Entrevistas({ vagas }: { vagas: ResumoVaga[] }) {
  const linhas = vagas.flatMap((vaga) =>
    ORDEM.flatMap((tipo) => (vaga.kits[tipo] ? [{ vaga, tipo, kit: vaga.kits[tipo] }] : [])),
  );
  if (linhas.length === 0) return null;

  return (
    <section aria-labelledby="titulo-entrevistas" className="mt-14">
      <h2 id="titulo-entrevistas" className="text-rotulo text-cinza-quente">
        Suas entrevistas <span className="tabular-nums">· {linhas.length}</span>
      </h2>
      <ul className="mt-4 divide-y divide-fio border-y border-fio">
        {linhas.map(({ vaga, tipo, kit }) => {
          const pct = kit.total ? Math.round((kit.prontas / kit.total) * 100) : 0;
          const comMapa = kit.total > 0;
          const atalhos = [
            { nome: "Conversa", href: `/kits/${kit.id}/conversa?tipo=${tipo}`, ok: true },
            { nome: "Mapa", href: `/kits/${kit.id}/mapa`, ok: comMapa },
            { nome: "Prática", href: `/kits/${kit.id}/pratica`, ok: comMapa },
            { nome: "Hora do Show", href: `/hora-do-show/${kit.id}`, ok: comMapa },
          ].filter((a) => a.ok);

          return (
            <li
              key={kit.id}
              className="grid gap-x-8 gap-y-3 py-5 md:grid-cols-[minmax(0,1fr)_9rem_auto] md:items-center"
            >
              <div className="min-w-0">
                <p className="font-medium">{NOME_TIPO[tipo]}</p>
                <p className="truncate text-sm text-cinza-quente">
                  {[vaga.cargo ?? "Vaga sem cargo", vaga.empresa].filter(Boolean).join(" · ")} ·{" "}
                  <span className="tabular-nums">{entrevistaEm(vaga.dias)}</span>
                </p>
              </div>

              <p className="text-sm">
                {comMapa ? (
                  <>
                    <span
                      className={`font-display text-xl font-semibold tabular-nums ${pct === 100 ? "text-menta" : ""}`}
                    >
                      {pct}%
                    </span>{" "}
                    <span className="text-cinza-quente">pronto</span>
                  </>
                ) : (
                  <span className="text-cinza-quente">{STATUS[kit.status]}</span>
                )}
              </p>

              <nav aria-label={`Atalhos: ${NOME_TIPO[tipo]}, ${vaga.cargo ?? "vaga"}`} className="flex flex-wrap gap-2">
                {atalhos.map((a) => (
                  <Link
                    key={a.nome}
                    href={a.href}
                    className={`rounded-[3px] border px-3 py-1.5 text-sm transition-colors duration-150 ${
                      a.href === kit.proxima.href.split("?")[0] || a.href === kit.proxima.href
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
        })}
      </ul>
    </section>
  );
}
