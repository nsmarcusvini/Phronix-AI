import type { Metadata } from "next";
import Link from "next/link";
import { PLANOS } from "@/lib/planos";
import { DemoShow } from "./_components/demo-show";
import { RespostaHero } from "./_components/resposta-hero";
import { TelaConfirmar, TelaDiagnostico, TelaMapa, TelaPratica } from "./_components/telas";

// Copy literal de docs/landing-copy.md.
// Direção (frontend-design): um único momento, o hero, em que uma resposta
// real se monta e o tempo para antes dos 30 s. O resto é quieto: texto ao lado
// de telas reais do produto, sem entradas animadas por seção.

export const metadata: Metadata = {
  title: { absolute: "Phronix AI · Você sabe o que fez. Agora, saiba contar." },
  description:
    "O Phronix transforma seu currículo e a vaga em um roteiro curto, ensaiado e à mão na hora da entrevista.",
};

const FAQ = [
  {
    pergunta: "A IA vai inventar experiência por mim?",
    resposta:
      "Não. Ela só usa o que está no seu currículo e na conversa. Dado que falta vira um marcador para você confirmar, e cada resposta aponta para um caso real seu.",
  },
  {
    pergunta: "Posso usar durante a entrevista?",
    resposta:
      "A Hora do Show é um roteiro pessoal, como anotações. O Phronix não escuta, não grava e não transcreve a chamada. Alguns processos, principalmente testes técnicos, proíbem consulta; nesses, respeite a regra.",
  },
  {
    pergunta: "Quanto tempo leva?",
    resposta: "O mapa com suas respostas sai em uma sessão. Depois, sessões de prática de 5 minutos até o dia.",
  },
  {
    pergunta: "Funciona sem internet?",
    resposta: "A Prática e a Hora do Show, sim, depois que o kit é aberto uma vez com internet.",
  },
  {
    pergunta: "Tem em inglês?",
    resposta: "Ainda não. Por enquanto, o Phronix funciona em português.",
  },
];

function BotaoComecar() {
  return (
    <Link
      href="/preparacoes/nova"
      className="inline-block rounded-[3px] bg-fenix px-7 py-3.5 font-semibold text-noite transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
    >
      Começar preparação grátis
    </Link>
  );
}

const PASSOS = [
  {
    numero: "01",
    nome: "Prepare",
    texto:
      "Envie o currículo e cole a vaga. Você vê seu nível, o match com a vaga e responde uma conversa curta que encontra os casos que o currículo não conta.",
  },
  {
    numero: "02",
    nome: "Pratique",
    texto:
      "Sessões de 5 minutos com flashcards, âncoras e lacunas. A agenda se ajusta à data da entrevista: faltando três dias, as revisões acontecem em horas.",
  },
  {
    numero: "03",
    nome: "Use ao vivo",
    texto:
      "Na Hora do Show, uma tela preta mostra só o que você vai falar. Busca por poucas letras, atalhos de teclado e funciona sem internet.",
  },
];

function Passo({
  indice,
  children,
  abaixo,
}: {
  indice: number;
  children?: React.ReactNode;
  abaixo?: React.ReactNode;
}) {
  const p = PASSOS[indice];
  return (
    <li className="border-t border-fio py-14 sm:py-20">
      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div>
          <p className="font-display text-xl tabular-nums text-cinza-quente">{p.numero}</p>
          <h3 className="mt-2 font-display text-display-lg font-medium">{p.nome}</h3>
          <p className="mt-4 max-w-[42ch] text-lg leading-relaxed text-cinza-quente">{p.texto}</p>
        </div>
        {children && <div className="min-w-0">{children}</div>}
      </div>
      {abaixo && <div className="mt-12">{abaixo}</div>}
    </li>
  );
}

export default function Landing() {
  return (
    <>
      {/* Hero no Palco: a entrevista acontecendo. */}
      <div className="bg-palco">
        <header className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-8">
          {/* Logo pendente: wordmark provisório. */}
          <span className="font-display text-lg font-semibold tracking-tight">Phronix</span>
          <nav aria-label="Principal" className="ml-auto flex items-center gap-6 text-sm">
            <a href="#como-funciona" className="hidden text-cinza-quente hover:text-osso sm:inline">
              Como funciona
            </a>
            <a href="#planos" className="hidden text-cinza-quente hover:text-osso sm:inline">
              Planos
            </a>
            <Link href="/entrar" className="text-osso">
              Entrar
            </Link>
          </nav>
        </header>

        <section className="mx-auto w-full max-w-6xl px-4 pt-14 pb-24 sm:px-8 sm:pt-24 sm:pb-32">
          <h1 className="font-display text-[clamp(2.75rem,0.9rem+6.6vw,7rem)] leading-[0.95] font-semibold tracking-[-0.045em]">
            <span className="block">
              Você sabe <br className="sm:hidden" />o que fez.
            </span>
            <span className="block">Agora, saiba contar.</span>
          </h1>
          <div className="mt-14 grid gap-16 sm:mt-20 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-end lg:gap-20">
            <div>
              <p className="max-w-[44ch] text-lg leading-relaxed text-osso/85">
                O Phronix transforma seu currículo e a vaga em um roteiro curto, ensaiado e à mão na hora da entrevista.
                Respostas no seu tom, ligadas a casos reais, para falar em 30 segundos.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <BotaoComecar />
                <p className="text-sm text-cinza-quente">
                  Para quem tem entrevista marcada.
                  <br />
                  Primeiro kit grátis, sem cartão.
                </p>
              </div>
            </div>
            <div className="lg:border-l lg:border-fio lg:pl-12">
              <RespostaHero />
            </div>
          </div>
        </section>
      </div>

      <main>
        {/* O problema */}
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-24 sm:px-8 sm:py-32 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12">
          <h2 className="max-w-[14ch] font-display text-display-lg font-medium text-balance">
            Travar não é falta de experiência.
          </h2>
          <p className="max-w-[46ch] text-xl leading-relaxed text-cinza-quente lg:pt-2">
            Você fez o trabalho. Na hora de contar, a resposta sai longa, sem número e sem ligação com a vaga. É isso
            que custa a próxima etapa.
          </p>
        </section>

        {/* Como funciona: sequência real, por isso 01, 02, 03. */}
        <section id="como-funciona" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 pb-12 sm:px-8">
          <h2 className="max-w-[18ch] pb-12 font-display text-display-lg font-medium text-balance">
            Do currículo à entrevista, em três passos.
          </h2>
          <ol>
            <Passo indice={0}>
              <div className="space-y-6">
                <TelaDiagnostico />
                <TelaMapa className="lg:ml-16" />
              </div>
            </Passo>
            <Passo indice={1}>
              <TelaPratica />
            </Passo>
            <Passo
              indice={2}
              abaixo={
                <>
                  <p className="mb-3 text-sm text-cinza-quente">
                    Clique na tela e use <kbd className="text-osso">/</kbd> para buscar,{" "}
                    <kbd className="text-osso">↑ ↓</kbd> para navegar e <kbd className="text-osso">A</kbd> para ver só
                    as âncoras.
                  </p>
                  <DemoShow />
                  <p className="mt-6 max-w-[62ch] text-sm text-cinza-quente">
                    É um roteiro pessoal: o Phronix não escuta nem grava a chamada. Alguns testes técnicos proíbem
                    consulta; respeite as regras do processo.
                  </p>
                </>
              }
            >
              <div className="lg:pt-9">
                <h4 className="max-w-[18ch] font-display text-3xl font-medium text-balance">
                  Na hora H, só o que você vai falar.
                </h4>
                <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-cinza-quente">
                  Abra ao lado do Meet, do Zoom ou do Teams. Digite duas letras, a pergunta aparece. Bata o olho no
                  gancho e nas três âncoras e volte para a câmera.
                </p>
              </div>
            </Passo>
          </ol>
        </section>

        {/* Verdade: a única seção clara; a prova é a própria tela. */}
        <section className="bg-osso text-noite">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-24 sm:px-8 sm:py-32 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-center">
            <div>
              <h2 className="max-w-[14ch] font-display text-display-lg font-semibold text-balance">
                A IA não inventa nada sobre você.
              </h2>
              <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-noite/80">
                Nenhuma empresa, projeto, tecnologia ou número que não esteja no seu currículo ou na conversa. Quando
                falta um dado, ele aparece marcado para você confirmar antes de usar.
              </p>
            </div>
            <div className="text-osso lg:pl-8">
              <TelaConfirmar />
            </div>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12">
            <h2 className="max-w-[16ch] font-display text-display-lg font-medium text-balance">
              Comece grátis. Pague quando a entrevista for marcada.
            </h2>
            <p className="max-w-[44ch] text-lg leading-relaxed text-cinza-quente lg:pt-2">
              Busca de emprego vem em ondas. Por isso existe o kit avulso, além da assinatura para quem está em vários
              processos.
            </p>
          </div>
          <ul className="mt-14 border-t border-fio">
            {PLANOS.map((p) => (
              <li
                key={p.id}
                className="grid gap-x-8 gap-y-1 border-b border-fio py-6 sm:grid-cols-[12rem_1fr_auto] sm:items-baseline"
              >
                <span className="font-display text-xl font-medium">{p.nome}</span>
                <span className="text-cinza-quente">{p.inclui}</span>
                <span className="whitespace-nowrap sm:text-right">
                  <span className="font-display text-2xl font-medium tabular-nums">{p.preco}</span>
                  {p.periodo && <span className="text-sm text-cinza-quente">{p.periodo}</span>}
                  {p.nota && <span className="block text-rotulo text-cinza-quente">{p.nota}</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <BotaoComecar />
            <span className="text-sm text-cinza-quente">Preços de teste do beta.</span>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-fio">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-24 sm:px-8 sm:py-32 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12">
            <h2 className="font-display text-display-lg font-medium">Perguntas frequentes</h2>
            <div className="border-t border-fio">
              {FAQ.map((f) => (
                <details key={f.pergunta} className="group border-b border-fio">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
                    {f.pergunta}
                    <span aria-hidden className="text-cinza-quente transition-transform duration-200 ease-brasa group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="max-w-[60ch] pb-6 leading-relaxed text-cinza-quente">{f.resposta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Chamada final */}
        <section className="border-t border-fio">
          <div className="mx-auto w-full max-w-6xl px-4 py-28 sm:px-8 sm:py-40">
            <h2 className="font-display text-[clamp(2.5rem,1rem+5vw,5.25rem)] leading-[0.95] font-semibold tracking-[-0.045em]">
              <span className="lg:block">Sua próxima entrevista </span>
              <span className="lg:block">merece um roteiro.</span>
            </h2>
            <div className="mt-12">
              <BotaoComecar />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-fio">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-8 text-sm text-cinza-quente sm:px-8">
          <span className="font-display font-semibold text-osso">Phronix AI</span>
          <span>Termos de uso e Política de privacidade (em breve)</span>
        </div>
      </footer>
    </>
  );
}
