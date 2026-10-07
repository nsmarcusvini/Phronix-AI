"use client";

import { useEffect, useRef } from "react";

// Reveal ao rolar. O conteúdo nasce visível (sem JS, nada some); depois de
// montar, o que está fora da tela esconde e entra quando aparece.
// Com prefers-reduced-motion, a transição é anulada pelo CSS global.
export function Revelar({
  children,
  atraso = 0,
  className = "",
  como: Tag = "div",
}: {
  children: React.ReactNode;
  atraso?: number;
  className?: string;
  como?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const caixa = el.getBoundingClientRect();
    if (caixa.top < window.innerHeight && caixa.bottom > 0) return;
    el.dataset.oculto = "";
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          delete el.dataset.oculto;
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <Tag
      // @ts-expect-error: ref genérico para as três tags possíveis
      ref={ref}
      style={{ transitionDelay: `${atraso}ms` }}
      className={`transition-[opacity,transform] duration-[800ms] ease-brasa data-[oculto]:translate-y-8 data-[oculto]:opacity-0 ${className}`}
    >
      {children}
    </Tag>
  );
}
