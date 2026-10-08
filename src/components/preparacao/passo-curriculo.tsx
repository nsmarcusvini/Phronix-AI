"use client";

import { useRef, useState } from "react";
import { Campo } from "@/components/campo-inline";
import type { CurriculoExtraido } from "@/lib/ai/esquemas";
import type { EntradaCurriculo } from "@/lib/preparacao/salvar";
import { BotaoPrimario, Processando } from "./comum";

const LIMITE_BYTES = 5 * 1024 * 1024;
const TIPOS = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
} as const;

type Fase = "enviar" | "extraindo" | "revisar";
type CampoCv = { valor: string; baixaConfianca: boolean };

const ETAPAS = ["Lendo o arquivo", "Separando experiências", "Procurando números e conquistas", "Conferindo datas"];

// Onboarding: o currículo é lido, revisado e vira a base de todas as vagas.
export function PassoCurriculo({
  onConfirmado,
  salvando = false,
  erroSalvar = null,
}: {
  onConfirmado: (curriculo: CurriculoExtraido, entrada: EntradaCurriculo) => void;
  salvando?: boolean;
  erroSalvar?: string | null;
}) {
  const [fase, setFase] = useState<Fase>("enviar");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [colado, setColado] = useState("");
  const [modoColar, setModoColar] = useState(false);
  const [consentimento, setConsentimento] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [extraido, setExtraido] = useState<{ cv: CurriculoExtraido; entrada: EntradaCurriculo } | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  function escolher(f: File | undefined) {
    if (!f) return;
    if (!(f.type in TIPOS)) {
      setErro("Envie um PDF com texto ou um DOCX. Se tiver outro formato, cole o texto.");
      return;
    }
    if (f.size > LIMITE_BYTES) {
      setErro("O arquivo passa de 5 MB. Tente exportar de novo ou cole o texto.");
      return;
    }
    setErro(null);
    setArquivo(f);
  }

  async function ler() {
    const dados = new FormData();
    let lida: EntradaCurriculo;
    if (modoColar) {
      lida = { tipo: "texto", texto: colado.trim() };
      dados.set("texto", colado.trim());
    } else if (arquivo) {
      lida = { tipo: "arquivo", arquivo };
      dados.set("arquivo", arquivo);
    } else return;

    setErro(null);
    setFase("extraindo");
    const resposta = await fetch("/api/ia/curriculo", { method: "POST", body: dados }).catch(() => null);
    const corpo = await resposta?.json().catch(() => null);

    if (!resposta?.ok || !corpo?.curriculo) {
      setErro(corpo?.erro ?? "Não deu para ler o currículo agora. Tente de novo.");
      setFase("enviar");
      return;
    }
    const cv = corpo.curriculo as CurriculoExtraido;
    if (cv.ilegivel) {
      setErro("Não consegui ler o texto desse arquivo; parece um PDF escaneado. Cole o texto do currículo.");
      setModoColar(true);
      setFase("enviar");
      return;
    }
    setExtraido({ cv, entrada: lida });
    setFase("revisar");
  }

  const pronto = consentimento && (modoColar ? colado.trim().length > 200 : arquivo !== null);

  if (fase === "extraindo") {
    return (
      <section aria-labelledby="titulo-extraindo">
        <h1 id="titulo-extraindo" className="font-display text-display-lg font-medium">
          Lendo seu currículo
        </h1>
        <div className="mt-10">
          <Processando etapas={ETAPAS} duracao={6000} />
        </div>
      </section>
    );
  }

  if (fase === "revisar" && extraido) {
    return (
      <Revisao
        inicial={extraido.cv}
        salvando={salvando}
        erro={erroSalvar}
        onConfirmar={(cv) => onConfirmado(cv, extraido.entrada)}
      />
    );
  }

  return (
    <section aria-labelledby="titulo-curriculo">
      <h1 id="titulo-curriculo" className="max-w-[18ch] font-display text-display-lg font-medium text-balance">
        Comece pelo seu currículo.
      </h1>
      <p className="mt-4 max-w-prose text-cinza-quente">
        Ele vira a base de todas as suas preparações. Você confere os dados em um minuto e depois cadastra as vagas no
        painel.
      </p>

      <div className="mt-10">
        {modoColar ? (
          <label className="block">
            <span className="text-rotulo text-cinza-quente">Texto do currículo</span>
            <textarea
              value={colado}
              onChange={(e) => setColado(e.target.value)}
              rows={10}
              className="mt-2 block w-full resize-y rounded-[3px] border border-fio bg-grafite p-4 leading-relaxed text-osso focus:border-cinza-quente focus:outline-none"
            />
          </label>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastando(false);
              escolher(e.dataTransfer.files[0]);
            }}
            className={`flex flex-col items-start gap-4 rounded-[3px] border border-dashed p-8 transition-colors duration-200 sm:p-10 ${
              arrastando ? "border-osso bg-grafite" : "border-fio"
            }`}
          >
            {arquivo ? (
              <p>
                <span className="font-medium">{arquivo.name}</span>
                <span className="ml-3 text-sm text-cinza-quente">
                  {TIPOS[arquivo.type as keyof typeof TIPOS]} · {(arquivo.size / 1024).toFixed(0)} KB
                </span>
              </p>
            ) : (
              <p className="font-display text-2xl font-medium">Solte o arquivo aqui</p>
            )}
            <p className="text-sm text-cinza-quente">PDF com texto ou DOCX, até 5 MB.</p>
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              className="rounded-[3px] border border-fio px-4 py-2 text-sm hover:border-cinza-quente"
            >
              {arquivo ? "Trocar arquivo" : "Escolher arquivo"}
            </button>
            <input
              ref={entrada}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => escolher(e.target.files?.[0])}
            />
          </div>
        )}

        {erro && (
          <p role="alert" className="mt-3 text-sm text-ambar">
            {erro}
          </p>
        )}

        <button
          type="button"
          onClick={() => setModoColar((m) => !m)}
          className="mt-4 text-sm text-cinza-quente underline-offset-4 hover:text-osso hover:underline"
        >
          {modoColar ? "Prefiro enviar o arquivo" : "PDF escaneado ou sem arquivo? Cole o texto"}
        </button>
      </div>

      <label className="mt-10 flex max-w-prose cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={consentimento}
          onChange={(e) => setConsentimento(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-osso"
        />
        <span className="text-cinza-quente">
          <span className="text-osso">Autorizo o uso do meu currículo para montar minhas preparações.</span> O arquivo é
          apagado depois da leitura; ficam só os dados que você revisar.
        </span>
      </label>

      <div className="mt-10">
        <BotaoPrimario disabled={!pronto} onClick={() => void ler()}>
          Ler currículo
        </BotaoPrimario>
      </div>
    </section>
  );
}

// Revisão de 1 minuto. Tudo é editável e a tela diz isso sem precisar de
// hover: texto com sublinhado tracejado e lápis, rótulo em cada campo,
// experiências e conquistas que dá para adicionar e remover. O que a IA leu
// com pouca certeza fica em Âmbar até a pessoa corrigir ou confirmar.
type Experiencia = CurriculoExtraido["experiencias"][number];

let proximaChave = 0;
const novaChave = () => `k${proximaChave++}`;

function Revisao({
  inicial,
  salvando,
  erro,
  onConfirmar,
}: {
  inicial: CurriculoExtraido;
  salvando: boolean;
  erro: string | null;
  onConfirmar: (cv: CurriculoExtraido) => void;
}) {
  const [cv, setCv] = useState(inicial);
  // Chaves estáveis para a lista sobreviver a remoções sem trocar o campo em edição.
  const [chaves, setChaves] = useState(() => inicial.experiencias.map(novaChave));
  const [skill, setSkill] = useState("");
  const corrigido = (valor: string): CampoCv => ({ valor, baixaConfianca: false });
  const duvidas =
    [cv.nome, cv.titulo, cv.formacao, cv.idiomas].filter((c) => c.baixaConfianca).length +
    cv.experiencias.reduce(
      (s, e) => s + [e.empresa, e.cargo, e.periodo, ...e.conquistas].filter((c) => c.baixaConfianca).length,
      0,
    );

  function experiencia(i: number, mudar: (e: Experiencia) => Experiencia) {
    setCv((c) => ({ ...c, experiencias: c.experiencias.map((e, k) => (k === i ? mudar(e) : e)) }));
  }

  function adicionarExperiencia() {
    const vazio = corrigido("");
    setCv((c) => ({
      ...c,
      experiencias: [...c.experiencias, { cargo: vazio, empresa: vazio, periodo: vazio, conquistas: [vazio] }],
    }));
    setChaves((k) => [...k, novaChave()]);
  }

  function removerExperiencia(i: number) {
    setCv((c) => ({ ...c, experiencias: c.experiencias.filter((_, k) => k !== i) }));
    setChaves((k) => k.filter((_, j) => j !== i));
  }

  function adicionarSkill() {
    const nova = skill.trim();
    if (nova && !cv.skills.includes(nova)) setCv((c) => ({ ...c, skills: [...c.skills, nova] }));
    setSkill("");
  }

  function irParaDuvida() {
    const alvo = document.querySelector<HTMLElement>("[data-duvida] button");
    alvo?.scrollIntoView({ block: "center", behavior: "smooth" });
    alvo?.focus({ preventScroll: true });
  }

  return (
    <>
      <section aria-labelledby="titulo-revisao" className="animate-revelar pb-28">
        <h1 id="titulo-revisao" className="font-display text-display-lg font-medium">
          Confira em um minuto.
        </h1>
        <p className="mt-4 max-w-prose text-cinza-quente">
          A IA leu seu currículo. <span className="text-osso">Tudo aqui é editável</span>: toque em qualquer texto
          sublinhado para corrigir, e adicione o que ficou de fora.
        </p>
        {duvidas > 0 && (
          <button
            type="button"
            onClick={irParaDuvida}
            className="mt-5 flex items-center gap-2 text-sm text-ambar underline-offset-4 hover:underline"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-ambar" />
            {duvidas === 1 ? "1 campo pede atenção" : `${duvidas} campos pedem atenção`} · ir para o próximo
          </button>
        )}

        <h2 className="mt-14 text-rotulo text-cinza-quente">Você</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-2 border-t border-fio pt-6 sm:grid-cols-[9rem_1fr] sm:gap-y-5">
          <Linha
            rotulo="Nome"
            campo={cv.nome}
            onChange={(v) => setCv({ ...cv, nome: corrigido(v) })}
            onConfirmar={() => setCv({ ...cv, nome: corrigido(cv.nome.valor) })}
            grande
          />
          <Linha
            rotulo="Título"
            campo={cv.titulo}
            onChange={(v) => setCv({ ...cv, titulo: corrigido(v) })}
            onConfirmar={() => setCv({ ...cv, titulo: corrigido(cv.titulo.valor) })}
          />
          <Linha
            rotulo="Formação"
            campo={cv.formacao}
            onChange={(v) => setCv({ ...cv, formacao: corrigido(v) })}
            onConfirmar={() => setCv({ ...cv, formacao: corrigido(cv.formacao.valor) })}
          />
          <Linha
            rotulo="Idiomas"
            campo={cv.idiomas}
            onChange={(v) => setCv({ ...cv, idiomas: corrigido(v) })}
            onConfirmar={() => setCv({ ...cv, idiomas: corrigido(cv.idiomas.valor) })}
          />

          <dt className="mt-6 pt-1 text-rotulo text-cinza-quente sm:mt-0">Skills</dt>
          <dd>
            <ul className="flex flex-wrap gap-2">
              {cv.skills.map((s) => (
                <li key={s} className="flex items-center rounded-[3px] border border-fio text-sm">
                  <span className="py-1 pl-2.5">{s}</span>
                  <button
                    type="button"
                    onClick={() => setCv((c) => ({ ...c, skills: c.skills.filter((x) => x !== s) }))}
                    className="px-2 py-1 text-cinza-quente hover:text-osso"
                  >
                    <span aria-hidden>×</span>
                    <span className="sr-only">Remover {s}</span>
                  </button>
                </li>
              ))}
              <li>
                <input
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      adicionarSkill();
                    }
                  }}
                  onBlur={adicionarSkill}
                  placeholder="+ skill"
                  aria-label="Adicionar skill"
                  className="w-28 rounded-[3px] border border-dashed border-fio bg-transparent px-2.5 py-1 text-sm text-osso placeholder:text-cinza-quente focus:w-44 focus:border-cinza-quente focus:outline-none"
                />
              </li>
            </ul>
          </dd>
        </dl>

        <div className="mt-16 flex items-baseline justify-between gap-4">
          <h2 className="text-rotulo text-cinza-quente">
            Experiências <span className="tabular-nums">· {cv.experiencias.length}</span>
          </h2>
        </div>
        <ol className="mt-4 space-y-4">
          {cv.experiencias.map((e, i) => (
            <li key={chaves[i]} className="rounded-[3px] border border-fio p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-rotulo tabular-nums text-cinza-quente">{String(i + 1).padStart(2, "0")}</span>
                <button
                  type="button"
                  onClick={() => removerExperiencia(i)}
                  className="text-rotulo text-cinza-quente underline-offset-4 hover:text-osso hover:underline"
                >
                  Remover experiência
                </button>
              </div>

              <div className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-[1fr_1fr_11rem]">
                <Rotulado rotulo="Cargo">
                  <Destaque
                    campo={e.cargo}
                    rotulo="cargo"
                    placeholder="Adicionar cargo"
                    forte
                    onChange={(v) => experiencia(i, (x) => ({ ...x, cargo: corrigido(v) }))}
                    onConfirmar={() => experiencia(i, (x) => ({ ...x, cargo: corrigido(x.cargo.valor) }))}
                  />
                </Rotulado>
                <Rotulado rotulo="Empresa">
                  <Destaque
                    campo={e.empresa}
                    rotulo="empresa"
                    placeholder="Adicionar empresa"
                    onChange={(v) => experiencia(i, (x) => ({ ...x, empresa: corrigido(v) }))}
                    onConfirmar={() => experiencia(i, (x) => ({ ...x, empresa: corrigido(x.empresa.valor) }))}
                  />
                </Rotulado>
                <Rotulado rotulo="Período">
                  <Destaque
                    campo={e.periodo}
                    rotulo="período"
                    placeholder="Adicionar período"
                    onChange={(v) => experiencia(i, (x) => ({ ...x, periodo: corrigido(v) }))}
                    onConfirmar={() => experiencia(i, (x) => ({ ...x, periodo: corrigido(x.periodo.valor) }))}
                  />
                </Rotulado>
              </div>

              <p className="mt-6 text-rotulo text-cinza-quente">Conquistas</p>
              <ul className="mt-2 space-y-1">
                {e.conquistas.map((q, j) => (
                  <li key={j} className="group/conquista flex items-start gap-3">
                    <span aria-hidden className="mt-[1.05em] h-px w-3 shrink-0 bg-fio" />
                    <div className="min-w-0 flex-1">
                      <Destaque
                        campo={q}
                        rotulo="conquista"
                        placeholder="Descreva o que você fez e o resultado"
                        multilinha
                        onChange={(v) =>
                          experiencia(i, (x) => ({
                            ...x,
                            conquistas: x.conquistas.map((c, m) => (m === j ? corrigido(v) : c)),
                          }))
                        }
                        onConfirmar={() =>
                          experiencia(i, (x) => ({
                            ...x,
                            conquistas: x.conquistas.map((c, m) => (m === j ? corrigido(c.valor) : c)),
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        experiencia(i, (x) => ({ ...x, conquistas: x.conquistas.filter((_, m) => m !== j) }))
                      }
                      className="mt-1 shrink-0 px-1.5 py-0.5 text-cinza-quente hover:text-osso sm:opacity-0 sm:group-hover/conquista:opacity-100 sm:focus-visible:opacity-100"
                    >
                      <span aria-hidden>×</span>
                      <span className="sr-only">Remover conquista</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => experiencia(i, (x) => ({ ...x, conquistas: [...x.conquistas, corrigido("")] }))}
                className="mt-3 text-sm text-cinza-quente underline-offset-4 hover:text-osso hover:underline"
              >
                + Adicionar conquista
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={adicionarExperiencia}
          className="mt-4 w-full rounded-[3px] border border-dashed border-fio px-5 py-4 text-left text-cinza-quente transition-colors duration-150 hover:border-cinza-quente hover:text-osso"
        >
          + Adicionar experiência
        </button>
      </section>

      {/* A ação fica sempre à mão, mesmo no fim de uma lista longa. Fora da
          seção animada: o transform da animação prenderia o fixed nela. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-fio bg-noite/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
          <div className="flex max-w-3xl flex-1 flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p role="status" className={`text-sm ${duvidas ? "text-ambar" : "text-cinza-quente"}`}>
              {erro ? (
                <span className="text-ambar">{erro}</span>
              ) : duvidas ? (
                `${duvidas} para conferir`
              ) : (
                "Tudo conferido"
              )}
            </p>
            <BotaoPrimario disabled={salvando} onClick={() => onConfirmar(cv)}>
              {salvando ? "Salvando…" : "Está certo, ir para o painel"}
            </BotaoPrimario>
          </div>
        </div>
      </div>
    </>
  );
}

function Rotulado({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-rotulo text-cinza-quente">{rotulo}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Linha({
  rotulo,
  campo,
  onChange,
  onConfirmar,
  grande = false,
}: {
  rotulo: string;
  campo: CampoCv;
  onChange: (valor: string) => void;
  onConfirmar: () => void;
  grande?: boolean;
}) {
  return (
    <>
      <dt className="mt-6 pt-1 text-rotulo text-cinza-quente first:mt-0 sm:mt-0">{rotulo}</dt>
      <dd>
        <Destaque
          campo={campo}
          rotulo={rotulo}
          onChange={onChange}
          onConfirmar={onConfirmar}
          forte={grande}
          placeholder={`Adicionar ${rotulo.toLowerCase()}`}
        />
      </dd>
    </>
  );
}

function Destaque({
  campo,
  rotulo,
  onChange,
  onConfirmar,
  placeholder,
  forte = false,
  multilinha = false,
}: {
  campo: CampoCv;
  rotulo: string;
  onChange: (valor: string) => void;
  onConfirmar: () => void;
  placeholder: string;
  forte?: boolean;
  multilinha?: boolean;
}) {
  return (
    <div
      data-duvida={campo.baixaConfianca || undefined}
      className={campo.baixaConfianca ? "border-l-2 border-ambar pl-3" : undefined}
    >
      <Campo
        rotulo={rotulo}
        valor={campo.valor}
        onChange={onChange}
        linhaUnica={!multilinha}
        placeholder={placeholder}
        indicarEdicao
        className={forte ? "text-lg font-medium" : undefined}
      />
      {campo.baixaConfianca && (
        <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-rotulo text-ambar">
          Lido com pouca certeza.
          <button type="button" onClick={onConfirmar} className="text-osso underline underline-offset-4">
            Está certo
          </button>
        </p>
      )}
    </div>
  );
}
