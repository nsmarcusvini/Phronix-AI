"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Reconhecimento = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((evento: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type Construtor = new () => Reconhecimento;

function construtor(): Construtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Construtor; webkitSpeechRecognition?: Construtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Ditado pela Web Speech API, só onde o navegador suporta.
export function useDitado(onTexto: (texto: string) => void) {
  // Suporte é fixo por navegador: lido no cliente, falso no servidor.
  const suportado = useSyncExternalStore(
    () => () => {},
    () => construtor() !== null,
    () => false,
  );
  const [ouvindo, setOuvindo] = useState(false);
  const reconhecimento = useRef<Reconhecimento | null>(null);
  const retorno = useRef(onTexto);

  useEffect(() => {
    retorno.current = onTexto;
  });

  useEffect(() => {
    const Classe = construtor();
    if (!Classe) return;
    const r = new Classe();
    r.lang = "pt-BR";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (evento) => {
      for (let i = evento.resultIndex; i < evento.results.length; i++) {
        const resultado = evento.results[i];
        if (resultado.isFinal) retorno.current(resultado[0].transcript.trim());
      }
    };
    r.onend = () => setOuvindo(false);
    r.onerror = () => setOuvindo(false);
    reconhecimento.current = r;
    return () => r.stop();
  }, []);

  function alternar() {
    const r = reconhecimento.current;
    if (!r) return;
    if (ouvindo) {
      r.stop();
      setOuvindo(false);
    } else {
      try {
        r.start();
        setOuvindo(true);
      } catch {
        setOuvindo(false);
      }
    }
  }

  return { suportado, ouvindo, alternar };
}
