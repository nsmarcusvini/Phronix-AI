"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Categoria, QaItem } from "@/lib/domain";
import { indexar } from "@/lib/hora-do-show/busca";
import { CATEGORIAS } from "@/lib/hora-do-show/categorias";
import { MODOS, type Lado, type Modo } from "@/lib/hora-do-show/modo";
import { Busca } from "./busca";
import { LinhaDoOlhar } from "./linha-do-olhar";
import { Lista } from "./lista";
import { Resposta } from "./resposta";

type Props = {
  itens: QaItem[];
  demo: boolean;
  modo: Modo;
  lado: Lado;
  onModo: (modo: Modo) => void;
  // Embutido (demo da landing): altura própria e teclado só com o foco dentro.
  embutido?: boolean;
};

export function Palco({ itens, demo, modo, lado, onModo, embutido = false }: Props) {
  const raiz = useRef<HTMLDivElement>(null);
  const [atualId, setAtualId] = useState(() => (itens.find((i) => i.fixado) ?? itens[0]).id);
  const [abertas, setAbertas] = useState(() => new Set<Categoria>(CATEGORIAS.map((c) => c.id)));
  const [respondidas, setRespondidas] = useState(() => new Set<string>());
  const [listaAberta, setListaAberta] = useState(modo === "monitor");
  const [buscando, setBuscando] = useState(false);
  const [soAncoras, setSoAncoras] = useState(false);
  const [expandida, setExpandida] = useState(false);
  const [foco, setFoco] = useState(false);

  const indice = useMemo(() => indexar(itens), [itens]);
  const fixados = useMemo(() => itens.filter((i) => i.fixado), [itens]);
  const posicao = itens.findIndex((i) => i.id === atualId);
  const atual = itens[posicao];

  // No monitor a lista fica fixa ao lado; nos outros modos ela é uma gaveta.
  const gaveta = modo !== "monitor";

  function abrir(id: string) {
    const item = itens.find((i) => i.id === id);
    if (!item) return;
    setAtualId(id);
    setExpandida(false);
    setAbertas((a) => (a.has(item.categoria) ? a : new Set(a).add(item.categoria)));
    setBuscando(false);
    if (gaveta) setListaAberta(false);
  }

  function mover(passo: number) {
    const proximo = itens[posicao + passo];
    if (proximo) abrir(proximo.id);
  }

  function alternarCategoria(categoria: Categoria, abrirOuFechar?: boolean) {
    setAbertas((a) => {
      const nova = new Set(a);
      const deveAbrir = abrirOuFechar ?? !nova.has(categoria);
      if (deveAbrir) nova.add(categoria);
      else nova.delete(categoria);
      return nova;
    });
  }

  function alternarRespondida() {
    setRespondidas((r) => {
      const nova = new Set(r);
      if (nova.has(atualId)) nova.delete(atualId);
      else nova.add(atualId);
      return nova;
    });
  }

  function proximoModo() {
    const i = MODOS.findIndex((m) => m.id === modo);
    const novo = MODOS[(i + 1) % MODOS.length].id;
    onModo(novo);
    setListaAberta(novo === "monitor");
  }

  // Atalhos do PRD, mais M para trocar o modo de tela.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement;
      const digitando = alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA";

      if ((e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !digitando)) {
        e.preventDefault();
        setBuscando(true);
        return;
      }
      if (digitando || e.ctrlKey || e.metaKey || e.altKey) return;

      const tecla = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const categoria = Number(tecla);

      if (tecla === "ArrowDown" || tecla === "ArrowUp") {
        e.preventDefault();
        mover(tecla === "ArrowDown" ? 1 : -1);
      } else if (tecla === "ArrowLeft" || tecla === "ArrowRight") {
        e.preventDefault();
        if (atual) alternarCategoria(atual.categoria, tecla === "ArrowRight");
      } else if (tecla === "[") {
        setListaAberta((a) => !a);
      } else if (tecla === "a") {
        setSoAncoras((s) => !s);
      } else if (tecla === "e") {
        setExpandida((x) => !x);
      } else if (tecla === " ") {
        e.preventDefault();
        alternarRespondida();
      } else if (categoria >= 1 && categoria <= CATEGORIAS.length) {
        const primeiro = itens.find((i) => i.categoria === CATEGORIAS[categoria - 1].id);
        if (primeiro) abrir(primeiro.id);
      } else if (tecla === "f") {
        setFoco((f) => !f);
      } else if (tecla === "m") {
        proximoModo();
      } else if (tecla === "Escape") {
        setFoco(false);
        if (gaveta) setListaAberta(false);
      }
    }

    const alvo = embutido ? raiz.current : window;
    if (!alvo) return;
    const ouvir = aoTeclar as EventListener;
    alvo.addEventListener("keydown", ouvir);
    return () => alvo.removeEventListener("keydown", ouvir);
  });

  const lista = (
    <Lista
      itens={itens}
      atualId={atualId}
      respondidas={respondidas}
      abertas={abertas}
      onAlternarCategoria={(c) => alternarCategoria(c)}
      onEscolher={abrir}
    />
  );

  const mostrarLista = listaAberta && !foco;

  return (
    <div
      ref={raiz}
      tabIndex={embutido ? 0 : undefined}
      aria-label={embutido ? "Demonstração da Hora do Show. Clique e use o teclado." : undefined}
      className={`relative flex overflow-hidden ${embutido ? "h-full focus-visible:outline-none" : "h-dvh"}`}
    >
      {/* Monitor: lista fixa, do lado oposto ao da chamada. */}
      {!gaveta && mostrarLista && (
        <aside
          className={`w-[17rem] shrink-0 border-fio ${
            lado === "direita" ? "order-first border-r" : "order-last border-l"
          }`}
        >
          {lista}
        </aside>
      )}

      {/* Meia tela e celular: gaveta sobre o conteúdo. */}
      {gaveta && mostrarLista && (
        <>
          <button
            type="button"
            aria-label="Fechar lista de perguntas"
            onClick={() => setListaAberta(false)}
            className="absolute inset-0 z-30 bg-palco/70"
          />
          <aside className="absolute inset-y-0 left-0 z-40 w-[min(17rem,85vw)] border-r border-fio bg-palco">
            {lista}
          </aside>
        </>
      )}

      <main className="@container relative flex min-w-0 flex-1 flex-col">
        {!foco && <LinhaDoOlhar />}

        {buscando && (
          <Busca
            indice={indice}
            fixados={fixados}
            onEscolher={abrir}
            onFechar={() => setBuscando(false)}
          />
        )}

        <section
          className={`w-full max-w-[40rem] flex-1 overflow-y-auto px-6 pt-5 pb-8 ${
            modo === "monitor" ? (lado === "direita" ? "ml-auto" : "") : "mx-auto"
          }`}
        >
          {atual && (
            <Resposta
              item={atual}
              soAncoras={soAncoras}
              expandida={expandida}
              respondida={respondidas.has(atual.id)}
              foco={foco}
            />
          )}

          {modo === "celular" && atual && (
            <div className="mt-8 flex flex-wrap gap-2 text-hs-sidebar">
              <Alternar ativo={soAncoras} onClick={() => setSoAncoras((s) => !s)}>
                Só âncoras
              </Alternar>
              {atual.expandida && (
                <Alternar ativo={expandida} onClick={() => setExpandida((x) => !x)}>
                  Follow-up
                </Alternar>
              )}
              <Alternar ativo={respondidas.has(atual.id)} onClick={alternarRespondida}>
                Respondida
              </Alternar>
            </div>
          )}
        </section>

        {!foco && modo === "celular" && (
          <nav
            aria-label="Navegação"
            className="grid grid-cols-4 border-t border-fio pb-[env(safe-area-inset-bottom)] text-hs-sidebar"
          >
            <BotaoToque onClick={() => mover(-1)} desativado={posicao <= 0}>
              ‹ Anterior
            </BotaoToque>
            <BotaoToque onClick={() => setListaAberta(true)}>Perguntas</BotaoToque>
            <BotaoToque onClick={() => setBuscando(true)}>Buscar</BotaoToque>
            <BotaoToque onClick={() => mover(1)} desativado={posicao >= itens.length - 1}>
              Próxima ›
            </BotaoToque>
          </nav>
        )}

        {!foco && modo !== "celular" && (
          <Rodape
            demo={demo}
            onBuscar={() => setBuscando(true)}
            onLista={() => setListaAberta((a) => !a)}
          />
        )}
      </main>
    </div>
  );
}

function Rodape({
  demo,
  onBuscar,
  onLista,
}: {
  demo: boolean;
  onBuscar: () => void;
  onLista: () => void;
}) {
  const online = useOnline();
  const tempo = useCronometro();

  return (
    <footer className="flex items-center gap-x-5 border-t border-fio px-6 py-2.5 text-[0.8125rem] text-cinza-quente">
      <button type="button" onClick={onBuscar} className="hover:text-osso">
        / buscar
      </button>
      <button type="button" onClick={onLista} className="hover:text-osso">
        [ lista
      </button>
      <span className="hidden truncate @2xl:inline">
        ↑↓ navegar · A âncoras · E follow-up · Espaço respondida · F foco · M modo
      </span>
      <span className="ml-auto truncate">
        {demo && "demonstração · "}
        {online ? "kit no aparelho" : "sem internet · kit no aparelho"}
      </span>
      <span className="font-show-mono tabular-nums text-osso" aria-label="Tempo de entrevista">
        {tempo}
      </span>
    </footer>
  );
}

function Alternar({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`min-h-11 rounded-[3px] border px-4 ${
        ativo ? "border-osso text-osso" : "border-fio text-cinza-quente"
      }`}
    >
      {children}
    </button>
  );
}

function BotaoToque({
  onClick,
  desativado = false,
  children,
}: {
  onClick: () => void;
  desativado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desativado}
      className="min-h-14 text-osso disabled:text-fio"
    >
      {children}
    </button>
  );
}

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const atualizar = () => setOnline(navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);
  return online;
}

// Cronômetro da entrevista, a partir da entrada no palco.
function useCronometro() {
  const [inicio] = useState(() => Date.now());
  const [agora, setAgora] = useState(inicio);
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const segundos = Math.floor((agora - inicio) / 1000);
  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
