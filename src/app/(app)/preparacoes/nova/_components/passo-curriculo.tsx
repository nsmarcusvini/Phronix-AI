"use client";

import { useRef, useState } from "react";
import { Campo } from "@/components/campo-inline";
import { curriculoExemplo, type CampoExtraido } from "@/lib/demo/preparacao";
import type { EntradaCurriculo } from "@/lib/preparacao/salvar";
import { BotaoPrimario, Processando, RotuloExemplo } from "./comum";

const LIMITE_BYTES = 5 * 1024 * 1024;
const TIPOS = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
} as const;

type Fase = "enviar" | "extraindo" | "revisar";

export function PassoCurriculo({
  onEntrada,
  onContinuar,
}: {
  onEntrada: (entrada: EntradaCurriculo) => void;
  onContinuar: () => void;
}) {
  const [fase, setFase] = useState<Fase>("enviar");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [colado, setColado] = useState("");
  const [modoColar, setModoColar] = useState(false);
  const [consentimento, setConsentimento] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
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

  const pronto = consentimento && (modoColar ? colado.trim().length > 200 : arquivo !== null);

  if (fase === "extraindo") {
    return (
      <section aria-labelledby="titulo-extraindo">
        <h1 id="titulo-extraindo" className="font-display text-display-lg font-medium">
          Lendo seu currículo
        </h1>
        <div className="mt-10">
          <Processando
            etapas={["Lendo o arquivo", "Separando experiências", "Procurando números e conquistas", "Conferindo datas"]}
            onFim={() => setFase("revisar")}
          />
        </div>
      </section>
    );
  }

  if (fase === "revisar") return <Revisao onContinuar={onContinuar} />;

  return (
    <section aria-labelledby="titulo-curriculo">
      <h1 id="titulo-curriculo" className="max-w-[18ch] font-display text-display-lg font-medium text-balance">
        Comece pelo seu currículo.
      </h1>
      <p className="mt-4 max-w-prose text-cinza-quente">
        Ele vira dados que você confere em um minuto. Depois vem a vaga.
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
          <span className="text-osso">Autorizo o uso do meu currículo para montar esta preparação.</span> O arquivo é
          apagado depois da leitura; ficam só os dados que você revisar.
        </span>
      </label>

      <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
        <BotaoPrimario
          disabled={!pronto}
          onClick={() => {
            onEntrada(modoColar ? { tipo: "texto", texto: colado.trim() } : { tipo: "arquivo", arquivo: arquivo! });
            setFase("extraindo");
          }}
        >
          Ler currículo
        </BotaoPrimario>
        <button
          type="button"
          onClick={() => {
            setConsentimento(true);
            onEntrada({ tipo: "exemplo" });
            setFase("extraindo");
          }}
          className="text-sm text-osso underline-offset-4 hover:underline"
        >
          Usar currículo de exemplo
        </button>
      </div>
    </section>
  );
}

// Revisão de 1 minuto: tudo editável, baixa confiança em Âmbar.
function Revisao({ onContinuar }: { onContinuar: () => void }) {
  const [cv, setCv] = useState(curriculoExemplo);
  const duvidas =
    [cv.nome, cv.titulo, cv.formacao, cv.idiomas].filter((c) => c.baixaConfianca).length +
    cv.experiencias.reduce(
      (s, e) => s + [e.empresa, e.cargo, e.periodo, ...e.conquistas].filter((c) => c.baixaConfianca).length,
      0,
    );

  function atualizarExperiencia(i: number, chave: "empresa" | "cargo" | "periodo", valor: string) {
    setCv((c) => ({
      ...c,
      experiencias: c.experiencias.map((e, k) => (k === i ? { ...e, [chave]: { valor } } : e)),
    }));
  }

  function atualizarConquista(i: number, j: number, valor: string) {
    setCv((c) => ({
      ...c,
      experiencias: c.experiencias.map((e, k) =>
        k === i ? { ...e, conquistas: e.conquistas.map((q, m) => (m === j ? { valor } : q)) } : e,
      ),
    }));
  }

  return (
    <section aria-labelledby="titulo-revisao" className="animate-revelar">
      <h1 id="titulo-revisao" className="font-display text-display-lg font-medium">
        Confira em um minuto.
      </h1>
      <p className="mt-4 max-w-prose text-cinza-quente">
        Clique em qualquer campo para corrigir.{" "}
        {duvidas > 0 && (
          <span className="text-ambar">
            {duvidas === 1 ? "1 campo pede atenção." : `${duvidas} campos pedem atenção.`}
          </span>
        )}
      </p>
      <div className="mt-6">
        <RotuloExemplo>Os dados abaixo são do candidato de demonstração, não do arquivo enviado.</RotuloExemplo>
      </div>

      <dl className="mt-12 grid gap-x-8 gap-y-2 sm:grid-cols-[9rem_1fr] sm:gap-y-6">
        <Linha rotulo="Nome" campo={cv.nome} onChange={(valor) => setCv({ ...cv, nome: { valor } })} grande />
        <Linha rotulo="Título" campo={cv.titulo} onChange={(valor) => setCv({ ...cv, titulo: { valor } })} />
        <Linha rotulo="Formação" campo={cv.formacao} onChange={(valor) => setCv({ ...cv, formacao: { valor } })} />
        <Linha rotulo="Idiomas" campo={cv.idiomas} onChange={(valor) => setCv({ ...cv, idiomas: { valor } })} />
        <dt className="mt-6 pt-1 text-rotulo text-cinza-quente sm:mt-0">Skills</dt>
        <dd className="flex flex-wrap gap-2">
          {cv.skills.map((s) => (
            <span key={s} className="rounded-[3px] border border-fio px-2.5 py-1 text-sm">
              {s}
            </span>
          ))}
        </dd>
      </dl>

      <h2 className="mt-16 text-rotulo text-cinza-quente">Experiências</h2>
      <ol className="mt-4 divide-y divide-fio border-y border-fio">
        {cv.experiencias.map((e, i) => (
          <li key={i} className="py-6">
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-[1fr_1fr_10rem]">
              <Destaque campo={e.cargo} rotulo="cargo" onChange={(v) => atualizarExperiencia(i, "cargo", v)} forte />
              <Destaque campo={e.empresa} rotulo="empresa" onChange={(v) => atualizarExperiencia(i, "empresa", v)} />
              <Destaque campo={e.periodo} rotulo="período" onChange={(v) => atualizarExperiencia(i, "periodo", v)} />
            </div>
            <ul className="mt-4 space-y-1">
              {e.conquistas.map((q, j) => (
                <li key={j} className="flex gap-3">
                  <span aria-hidden className="mt-[0.9em] h-px w-3 shrink-0 bg-fio" />
                  <div className="flex-1">
                    <Destaque campo={q} rotulo="conquista" onChange={(v) => atualizarConquista(i, j, v)} />
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className="mt-12">
        <BotaoPrimario onClick={onContinuar}>Está certo, seguir para a vaga</BotaoPrimario>
      </div>
    </section>
  );
}

function Linha({
  rotulo,
  campo,
  onChange,
  grande = false,
}: {
  rotulo: string;
  campo: CampoExtraido;
  onChange: (valor: string) => void;
  grande?: boolean;
}) {
  return (
    <>
      <dt className="mt-6 pt-1 text-rotulo text-cinza-quente first:mt-0 sm:mt-0">{rotulo}</dt>
      <dd>
        <Destaque campo={campo} rotulo={rotulo} onChange={onChange} forte={grande} />
      </dd>
    </>
  );
}

function Destaque({
  campo,
  rotulo,
  onChange,
  forte = false,
}: {
  campo: CampoExtraido;
  rotulo: string;
  onChange: (valor: string) => void;
  forte?: boolean;
}) {
  return (
    <div className={campo.baixaConfianca ? "border-l border-ambar pl-3" : undefined}>
      <Campo
        rotulo={rotulo}
        valor={campo.valor}
        onChange={onChange}
        linhaUnica
        className={forte ? "text-lg font-medium" : undefined}
      />
      {campo.baixaConfianca && <p className="text-rotulo text-ambar">Confira: lido com pouca certeza.</p>}
    </div>
  );
}
