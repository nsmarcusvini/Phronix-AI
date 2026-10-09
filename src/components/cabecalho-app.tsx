"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/painel", nome: "Painel", tour: "nav-painel" },
  { href: "/elaborar", nome: "Elaborar entrevista", tour: "nav-elaborar" },
  { href: "/pratica", nome: "Praticar", tour: "nav-praticar" },
  { href: "/hora-do-show", nome: "Hora do Show", tour: "nav-show" },
  { href: "/conta", nome: "Conta", tour: "nav-conta" },
];

// Cabeçalho das telas do app fora de um kit. No celular, a navegação desce
// para uma segunda linha que rola de lado.
export function CabecalhoApp() {
  const caminho = usePathname();
  return (
    <header className="border-b border-fio">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center px-4 sm:h-14 sm:flex-nowrap sm:gap-6 sm:px-8">
        {/* Logo pendente: wordmark provisório. */}
        <Link
          href="/painel"
          className="flex h-12 items-center font-display text-lg font-semibold tracking-tight sm:h-auto"
        >
          Phronix
        </Link>
        <nav
          aria-label="Principal"
          className="-mx-4 flex w-[calc(100%+2rem)] items-center overflow-x-auto px-1 text-sm sm:mx-0 sm:ml-auto sm:w-auto sm:overflow-visible sm:px-0"
        >
          {LINKS.map((l) => {
            const ativo = caminho === l.href || caminho.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={ativo ? "page" : undefined}
                data-tour={l.tour}
                className={`relative flex h-11 shrink-0 items-center px-3 whitespace-nowrap sm:h-14 ${
                  ativo ? "text-osso" : "text-cinza-quente hover:text-osso"
                }`}
              >
                {l.nome}
                {ativo && <span aria-hidden className="absolute inset-x-3 bottom-0 h-px bg-fenix" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
