"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/painel", nome: "Painel" },
  { href: "/conta", nome: "Conta" },
];

// Cabeçalho das telas do app fora de um kit.
export function CabecalhoApp() {
  const caminho = usePathname();
  return (
    <header className="border-b border-fio">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-8">
        {/* Logo pendente: wordmark provisório. */}
        <Link href="/painel" className="font-display text-lg font-semibold tracking-tight">
          Phronix
        </Link>
        <nav aria-label="Principal" className="ml-auto flex items-center text-sm">
          {LINKS.map((l) => {
            const ativo = caminho === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={ativo ? "page" : undefined}
                data-tour={`nav-${l.nome.toLowerCase()}`}
                className={`relative flex h-14 items-center px-3 ${ativo ? "text-osso" : "text-cinza-quente hover:text-osso"}`}
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
