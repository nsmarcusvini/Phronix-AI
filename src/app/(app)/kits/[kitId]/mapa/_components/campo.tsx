"use client";

import { useRef, useState } from "react";
import { ComMarcadores } from "@/components/com-marcadores";

type Props = {
  valor: string;
  rotulo: string;
  onChange: (valor: string) => void;
  className?: string;
  placeholder?: string;
  linhaUnica?: boolean;
  // Ocupa só o tamanho do texto (âncoras lado a lado).
  compacto?: boolean;
};

// Edição inline: lê como texto (com [confirmar] em Âmbar), clica e vira campo.
// Esc desfaz, Enter (linha única) ou Ctrl+Enter confirma, sair do campo salva.
export function Campo({
  valor,
  rotulo,
  onChange,
  className = "",
  placeholder = "Vazio",
  linhaUnica = false,
  compacto = false,
}: Props) {
  const largura = compacto ? "inline-block min-w-[4ch] w-auto" : "block w-full";
  const [editando, setEditando] = useState(false);
  const original = useRef(valor);

  if (editando) {
    return (
      <textarea
        autoFocus
        aria-label={rotulo}
        value={valor}
        rows={1}
        onFocus={(e) => e.currentTarget.setSelectionRange(valor.length, valor.length)}
        onChange={(e) => onChange(linhaUnica ? e.target.value.replace(/\n/g, " ") : e.target.value)}
        onBlur={() => setEditando(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onChange(original.current);
            setEditando(false);
          } else if (e.key === "Enter" && (linhaUnica || e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            setEditando(false);
          }
        }}
        className={`field-sizing-content ${largura} resize-none rounded-[3px] bg-grafite px-2 py-1 -mx-2 text-osso outline outline-fio focus:outline-cinza-quente ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        original.current = valor;
        setEditando(true);
      }}
      className={`${largura} rounded-[3px] px-2 py-1 -mx-2 text-left transition-colors duration-150 hover:bg-grafite ${className}`}
    >
      <span className="sr-only">Editar {rotulo}: </span>
      {valor ? <ComMarcadores texto={valor} /> : <span className="text-cinza-quente">{placeholder}</span>}
    </button>
  );
}
