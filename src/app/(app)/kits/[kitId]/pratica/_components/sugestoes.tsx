import Link from "next/link";
import type { EstadoItem } from "@/lib/pratica/leitner";

// Errou a mesma resposta duas vezes seguidas: o app sugere encurtá-la no Mapa.
export function Sugestoes({
  kitId,
  estados,
  className = "",
}: {
  kitId: string;
  estados: EstadoItem[];
  className?: string;
}) {
  const travadas = estados.filter((e) => e.errosSeguidos >= 2);
  if (travadas.length === 0) return null;

  return (
    <section aria-labelledby="titulo-sugestoes" className={className}>
      <h2 id="titulo-sugestoes" className="text-rotulo text-cinza-quente">
        Errou duas vezes seguidas
      </h2>
      <ul className="mt-3 divide-y divide-fio border-y border-fio">
        {travadas.map((e) => (
          <li key={e.item.id} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-3">
            <span className="flex-1">{e.item.pergunta}</span>
            <Link
              href={`/kits/${kitId}/mapa`}
              className="text-sm text-osso underline-offset-4 hover:underline"
            >
              Encurtar no Mapa →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
