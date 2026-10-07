import { ReguaSenioridade } from "@/app/(app)/preparacoes/nova/_components/passo-diagnostico";
import { Regua } from "@/app/(app)/kits/[kitId]/mapa/_components/regua";
import { ComMarcadores } from "@/components/com-marcadores";
import { demoItens } from "@/lib/hora-do-show/demo";
import { fala } from "@/lib/mapa/fala";

// Telas reais do app com os dados do kit de demonstração: os mesmos
// componentes, só que estáticos. Cada moldura tem o tamanho do que mostra.

function Moldura({ tela, children, className = "" }: { tela: string; children: React.ReactNode; className?: string }) {
  return (
    <figure className={`overflow-hidden rounded-md border border-fio bg-noite ${className}`}>
      <figcaption className="border-b border-fio px-5 py-2.5 text-rotulo text-cinza-quente">{tela}</figcaption>
      <div className="p-5 sm:p-7">{children}</div>
    </figure>
  );
}

export function TelaDiagnostico() {
  return (
    <Moldura tela="Diagnóstico">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <p className="font-display text-2xl font-medium">Você está no nível pleno.</p>
        <p className="font-display text-4xl font-semibold tabular-nums">
          78<span className="text-lg text-cinza-quente">/100 de match</span>
        </p>
      </div>
      <ReguaSenioridade nivel="pleno" className="mt-10" />
    </Moldura>
  );
}

const CASE = demoItens.find((i) => i.categoria === "experiencia_cases")!;

export function TelaMapa({ className = "" }: { className?: string }) {
  return (
    <Moldura tela="Mapa" className={className}>
      <p className="text-sm text-cinza-quente">{CASE.pergunta}</p>
      <p className="mt-2 text-lg font-medium text-pretty">{CASE.gancho}</p>
      <div className="mt-6">
        <Regua {...fala(CASE)} />
      </div>
    </Moldura>
  );
}

// Mesma distribuição do histórico de exemplo do demo.
const COLUNAS = [
  { nome: "Caixa 1", pontos: 2, classe: "bg-osso" },
  { nome: "Caixa 2", pontos: 3, classe: "bg-osso" },
  { nome: "Caixa 3", pontos: 2, classe: "bg-osso" },
  { nome: "Caixa 4", pontos: 2, classe: "border border-cinza-quente" },
  { nome: "Palco", pontos: 3, classe: "bg-menta" },
];

export function TelaPratica() {
  return (
    <Moldura tela="Prática">
      <p className="font-display text-5xl font-semibold tabular-nums">
        25%<span className="ml-3 text-base font-normal text-cinza-quente">pronto para o show</span>
      </p>
      <ol className="mt-8 grid grid-cols-5 border-y border-fio" aria-label="Respostas por caixa">
        {COLUNAS.map((c) => (
          <li key={c.nome} className="min-h-24 border-l border-fio px-2 py-3 first:border-l-0 sm:px-3">
            <p className={`text-rotulo ${c.nome === "Palco" ? "text-menta" : "text-cinza-quente"}`}>
              <span className="sr-only">{c.pontos} respostas em </span>
              {c.nome}
            </p>
            <p aria-hidden className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: c.pontos }, (_, i) => (
                <span key={i} className={`size-3 rounded-full ${c.classe}`} />
              ))}
            </p>
          </li>
        ))}
      </ol>
    </Moldura>
  );
}

const COM_DADO = demoItens.find((i) => i.bullets.some((b) => b.includes("[confirmar:")))!;

export function TelaConfirmar() {
  return (
    <Moldura tela="Mapa" className="bg-palco">
      <p className="text-sm text-cinza-quente">{COM_DADO.pergunta}</p>
      <ul className="mt-4 space-y-2">
        {COM_DADO.bullets.map((b) => (
          <li key={b} className="flex gap-3">
            <span aria-hidden className="mt-[0.75em] h-px w-3 shrink-0 bg-fio" />
            <span>
              <ComMarcadores texto={b} />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex items-center gap-2 text-sm text-ambar">
        <span aria-hidden className="size-1.5 rounded-full bg-ambar" />1 dado para confirmar
      </p>
    </Moldura>
  );
}
