import { ComMarcadores } from "@/components/com-marcadores";
import { demoItens } from "@/lib/hora-do-show/demo";

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
