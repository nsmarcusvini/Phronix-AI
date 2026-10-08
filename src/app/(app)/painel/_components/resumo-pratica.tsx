import Link from "next/link";
import { sequencia } from "@/lib/pratica/leitner";
import type { MetricasPratica } from "@/lib/pratica/metricas";
import type { ResumoVaga } from "@/lib/preparacao/listar";

const DIA = 86_400_000;

// Para onde o botão leva: o kit com mais respostas vencidas; sem nada vencido,
// o primeiro kit com mapa; sem mapa ainda, o kit de demonstração.
function destino(vagas: ResumoVaga[]) {
  const kits = vagas.flatMap((v) => Object.values(v.kits)).filter((k) => k.total > 0);
  const vencido = [...kits].sort((a, b) => b.aRevisar - a.aRevisar)[0];
  if (vencido && vencido.aRevisar > 0) {
    const n = vencido.aRevisar;
    return {
      href: `/kits/${vencido.id}/pratica`,
      texto: `Praticar agora · ${n} ${n === 1 ? "resposta" : "respostas"}`,
      demo: false,
    };
  }
  if (kits[0]) return { href: `/kits/${kits[0].id}/pratica`, texto: "Praticar agora", demo: false };
  return { href: "/kits/demo/pratica", texto: "Treinar com o kit de demonstração", demo: true };
}

function ultimaVez(iso: string | null) {
  if (!iso) return "Você ainda não praticou.";
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / DIA);
  if (dias <= 0) return "Última prática: hoje.";
  if (dias === 1) return "Última prática: ontem.";
  return `Última prática: há ${dias} dias.`;
}

// Fica no topo do painel, antes de tudo: a Prática é o que a pessoa volta para
// fazer todo dia. As métricas aparecem sempre, mesmo zeradas.
export function ResumoPratica({ metricas, vagas }: { metricas: MetricasPratica; vagas: ResumoVaga[] }) {
  const ir = destino(vagas);
  const respondidas = metricas.acertos + metricas.quase + metricas.erros;
  const taxa = respondidas ? Math.round((metricas.acertos / respondidas) * 100) : null;
  const dias = sequencia(metricas.recentes, new Date());

  const numeros = [
    { rotulo: "Vezes que praticou", valor: metricas.sessoes, cor: "" },
    { rotulo: "Acertos", valor: metricas.acertos, cor: metricas.acertos ? "text-menta" : "" },
    { rotulo: "Quase", valor: metricas.quase, cor: "" },
    { rotulo: "Erros", valor: metricas.erros, cor: metricas.erros ? "text-ambar" : "" },
  ];

  return (
    <section
      data-tour="pratica"
      aria-labelledby="titulo-pratica"
      className="mb-12 grid gap-6 border-y border-fio py-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12"
    >
      <div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 id="titulo-pratica" className="font-display text-xl font-medium">
            Prática
          </h2>
          {/* Depende do relógio e do fuso do aparelho: o servidor pode divergir. */}
          <p suppressHydrationWarning className="text-sm text-cinza-quente">
            {ultimaVez(metricas.ultimaEm)}
            {dias > 0 && ` ${dias} ${dias === 1 ? "dia seguido" : "dias seguidos"}.`}
          </p>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {numeros.map((n) => (
            <div key={n.rotulo}>
              <dt className="text-rotulo text-cinza-quente">{n.rotulo}</dt>
              <dd className={`mt-1 font-display text-3xl font-semibold tabular-nums ${n.cor}`}>{n.valor}</dd>
            </div>
          ))}
        </dl>
        {taxa !== null && (
          <p className="mt-3 text-sm text-cinza-quente">
            <span className="tabular-nums text-osso">{taxa}%</span> de acerto em {respondidas}{" "}
            {respondidas === 1 ? "resposta" : "respostas"}.
          </p>
        )}
      </div>

      <div className="flex flex-col items-start gap-2 lg:items-end">
        <Link
          href={ir.href}
          className="rounded-[3px] bg-osso px-6 py-3.5 font-semibold text-noite transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-fenix"
        >
          {ir.texto}
        </Link>
        {ir.demo && (
          <p className="max-w-[28ch] text-sm text-cinza-quente lg:text-right">
            Seus números contam a partir do primeiro kit seu com mapa.
          </p>
        )}
      </div>
    </section>
  );
}
