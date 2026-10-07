"use client";

import { useState } from "react";

export const MINIMO_SENHA = 8;

export function Pagina({
  rotulo,
  titulo,
  children,
}: {
  rotulo: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-12 pb-24 sm:px-8 sm:pt-24">
      <div className="max-w-md">
        <p className="text-rotulo text-cinza-quente">{rotulo}</p>
        <h1 className="mt-2 font-display text-display-lg font-medium text-balance">{titulo}</h1>
        <div className="mt-10">{children}</div>
      </div>
    </main>
  );
}

export function CampoTexto({
  rotulo,
  tipo = "text",
  valor,
  onChange,
  autoComplete,
  dica,
  autoFocus,
}: {
  rotulo: string;
  tipo?: "text" | "email";
  valor: string;
  onChange: (valor: string) => void;
  autoComplete?: string;
  dica?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-rotulo text-cinza-quente">{rotulo}</span>
      <input
        type={tipo}
        required
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full rounded-[3px] border border-fio bg-grafite px-3 py-2.5 text-osso focus:border-cinza-quente focus:outline-none"
      />
      {dica && <span className="mt-1.5 block text-rotulo text-cinza-quente">{dica}</span>}
    </label>
  );
}

export function CampoSenha({
  rotulo = "Senha",
  valor,
  onChange,
  nova = false,
  autoFocus,
}: {
  rotulo?: string;
  valor: string;
  onChange: (valor: string) => void;
  nova?: boolean;
  autoFocus?: boolean;
}) {
  const [ver, setVer] = useState(false);
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-rotulo text-cinza-quente">
        {rotulo}
        <button type="button" onClick={() => setVer((v) => !v)} className="hover:text-osso">
          {ver ? "Esconder" : "Mostrar"}
        </button>
      </span>
      <input
        type={ver ? "text" : "password"}
        required
        autoFocus={autoFocus}
        minLength={nova ? MINIMO_SENHA : undefined}
        autoComplete={nova ? "new-password" : "current-password"}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full rounded-[3px] border border-fio bg-grafite px-3 py-2.5 text-osso focus:border-cinza-quente focus:outline-none"
      />
      {nova && (
        <span className="mt-1.5 block text-rotulo text-cinza-quente">Pelo menos {MINIMO_SENHA} caracteres.</span>
      )}
    </label>
  );
}

export function Mensagem({ tipo, children }: { tipo: "erro" | "ok"; children: React.ReactNode }) {
  return (
    <p
      role={tipo === "erro" ? "alert" : "status"}
      className={`border-l pl-3 text-sm ${tipo === "erro" ? "border-ambar text-ambar" : "border-osso/50 text-osso"}`}
    >
      {children}
    </p>
  );
}

export function BotaoEnviar({ enviando, children }: { enviando: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={enviando}
      className="rounded-[3px] bg-fenix px-7 py-3.5 font-semibold text-noite shadow-fenix transition-[transform,opacity] duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {enviando ? "Um instante" : children}
    </button>
  );
}
