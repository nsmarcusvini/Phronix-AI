"use client";

import { useState } from "react";
import { vagaExemplo, vagaExtraida } from "@/lib/demo/preparacao";
import { BotaoPrimario, Processando, RotuloExemplo } from "./comum";

const MINIMO_CARACTERES = 300;

type Fase = "colar" | "lendo" | "entendida";

export function PassoVaga({ onContinuar }: { onContinuar: () => void }) {
  const [fase, setFase] = useState<Fase>("colar");
  const [texto, setTexto] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [data, setData] = useState("");
  const [tentou, setTentou] = useState(false);

  const curta = texto.trim().length < MINIMO_CARACTERES;

  if (fase === "lendo") {
    return (
      <section aria-labelledby="titulo-lendo-vaga">
        <h1 id="titulo-lendo-vaga" className="font-display text-display-lg font-medium">
          Lendo a vaga
        </h1>
        <div className="mt-10">
          <Processando
            etapas={["Separando requisitos e diferenciais", "Identificando o nível pedido", "Procurando sinais de cultura"]}
            onFim={() => setFase("entendida")}
            duracao={1400}
          />
        </div>
      </section>
    );
  }

  if (fase === "entendida") {
    return (
      <section aria-labelledby="titulo-entendida" className="animate-revelar">
        <p className="text-rotulo text-cinza-quente">O que entendemos da vaga</p>
        <h1 id="titulo-entendida" className="mt-2 font-display text-display-lg font-medium text-balance">
          {vagaExtraida.cargo}
        </h1>
        <p className="mt-3 text-cinza-quente">
          Nível pedido: <span className="text-osso">{vagaExtraida.nivelPedido.texto}</span>
          {data && (
            <>
              {" · "}Entrevista em <span className="text-osso tabular-nums">{data.split("-").reverse().join("/")}</span>
            </>
          )}
        </p>
        <div className="mt-6">
          <RotuloExemplo>A leitura abaixo é da vaga de demonstração.</RotuloExemplo>
        </div>

        <dl className="mt-12 space-y-8">
          <Grupo titulo="Obrigatórios" itens={vagaExtraida.obrigatorios} forte />
          <Grupo titulo="Diferenciais" itens={vagaExtraida.diferenciais} />
          <Grupo titulo="Comportamento" itens={vagaExtraida.comportamentais} />
        </dl>

        <p className="mt-12 max-w-prose text-cinza-quente">
          Cada requisito vira uma pergunta a cobrir com um case seu na conversa.
        </p>
        <div className="mt-8">
          <BotaoPrimario onClick={onContinuar}>Ver meu diagnóstico</BotaoPrimario>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-vaga">
      <h1 id="titulo-vaga" className="max-w-[18ch] font-display text-display-lg font-medium text-balance">
        Agora, a vaga.
      </h1>
      <p className="mt-4 max-w-prose text-cinza-quente">
        Cole a descrição inteira: requisitos, responsabilidades e o que mais tiver.
      </p>

      <form
        className="mt-10 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          setTentou(true);
          if (!curta) setFase("lendo");
        }}
      >
        <label className="block">
          <span className="flex items-baseline justify-between text-rotulo text-cinza-quente">
            Descrição da vaga
            <span className={`tabular-nums ${tentou && curta ? "text-ambar" : ""}`}>{texto.trim().length} caracteres</span>
          </span>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={12}
            aria-invalid={tentou && curta}
            aria-describedby="vaga-curta"
            className="mt-2 block w-full resize-y rounded-[3px] border border-fio bg-grafite p-4 leading-relaxed text-osso focus:border-cinza-quente focus:outline-none"
          />
          {tentou && curta && (
            <span id="vaga-curta" role="alert" className="mt-2 block text-sm text-ambar">
              Está curta demais para entender o que pedem. Cole o texto completo, com requisitos e responsabilidades.
            </span>
          )}
        </label>

        <div className="grid gap-6 sm:grid-cols-[1fr_1fr_12rem]">
          <Entrada rotulo="Empresa (opcional)" valor={empresa} onChange={setEmpresa} />
          <Entrada rotulo="Cargo (opcional)" valor={cargo} onChange={setCargo} />
          <Entrada rotulo="Data da entrevista" valor={data} onChange={setData} tipo="date" />
        </div>
        <p className="-mt-4 text-sm text-cinza-quente">
          Com a data, a prática se organiza até o dia da entrevista.
        </p>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
          <BotaoPrimario type="submit">Ler a vaga</BotaoPrimario>
          <button
            type="button"
            onClick={() => {
              setTexto(vagaExemplo.texto);
              setEmpresa(vagaExemplo.empresa);
              setCargo(vagaExemplo.cargo);
            }}
            className="text-sm text-osso underline-offset-4 hover:underline"
          >
            Usar vaga de exemplo
          </button>
        </div>
      </form>
    </section>
  );
}

function Entrada({
  rotulo,
  valor,
  onChange,
  tipo = "text",
}: {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  tipo?: string;
}) {
  return (
    <label className="block">
      <span className="text-rotulo text-cinza-quente">{rotulo}</span>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full rounded-[3px] border border-fio bg-grafite px-3 py-2.5 text-osso [color-scheme:dark] focus:border-cinza-quente focus:outline-none"
      />
    </label>
  );
}

function Grupo({ titulo, itens, forte = false }: { titulo: string; itens: string[]; forte?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
      <dt className="pt-1 text-rotulo text-cinza-quente">{titulo}</dt>
      <dd className="flex flex-wrap gap-2">
        {itens.map((item, i) => (
          <span
            key={item}
            className={`animate-revelar rounded-[3px] border px-3 py-1.5 text-sm ${
              forte ? "border-osso/40 text-osso" : "border-fio text-cinza-quente"
            }`}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            {item}
          </span>
        ))}
      </dd>
    </div>
  );
}
