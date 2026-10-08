"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// No celular as etapas descem para uma segunda linha.
export function NavKit({ kitId }: { kitId: string }) {
  const caminho = usePathname();
  const abas = [
    { href: `/kits/${kitId}/conversa`, nome: "Conversa" },
    { href: `/kits/${kitId}/mapa`, nome: "Mapa" },
    { href: `/kits/${kitId}/pratica`, nome: "Prática" },
  ];

  return (
    <header className="border-b border-fio">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 px-4 sm:px-8">
        {/* Logo pendente: wordmark provisório. */}
        <Link href="/painel" className="flex h-14 items-center font-display text-lg font-semibold tracking-tight">
          Phronix
        </Link>
        {kitId === "demo" && (
          <span className="hidden text-rotulo text-cinza-quente md:inline">Kit de demonstração</span>
        )}
        <Link
          href={`/hora-do-show/${kitId}`}
          className="order-2 ml-auto rounded-[3px] border border-fio px-3 py-1.5 text-sm whitespace-nowrap text-osso hover:border-cinza-quente sm:order-3 sm:ml-0"
        >
          Hora do Show
        </Link>
        <nav
          aria-label="Etapas do kit"
          className="order-3 -mx-3 flex w-full items-center text-sm sm:order-2 sm:mx-0 sm:ml-auto sm:w-auto"
        >
          {abas.map((aba) => {
            const ativa = caminho === aba.href;
            return (
              <Link
                key={aba.href}
                href={aba.href}
                aria-current={ativa ? "page" : undefined}
                className={`relative flex h-11 items-center px-3 sm:h-14 ${ativa ? "text-osso" : "text-cinza-quente hover:text-osso"}`}
              >
                {aba.nome}
                {ativa && <span aria-hidden className="absolute inset-x-3 bottom-0 h-px bg-fenix" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
