import type { Metadata } from "next";
import Link from "next/link";
import { PLANOS } from "@/lib/planos";
import { DemoShow } from "./_components/demo-show";
import { Passos } from "./_components/passos";
import { Revelar } from "./_components/revelar";

// Copy literal de docs/landing-copy.md.

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

function BotaoComecar({ grande = false }: { grande?: boolean }) {
  return (
    <Link
      href="/preparacoes/nova"
      className={`inline-block rounded-[3px] bg-fenix font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso ${
        grande ? "px-8 py-4 text-lg" : "px-7 py-3.5"
      }`}
    >
      Começar preparação grátis
    </Link>
  );
}

export default function Landing() {
  return (
    <>
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

      <main>
        {/* 1. Hero */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-28 sm:px-8 sm:pt-28 sm:pb-40">
          <p className="animate-revelar text-rotulo text-cinza-quente">Para quem tem entrevista marcada</p>
          <h1 className="mt-6 font-display text-[clamp(2.75rem,1.1rem+6.2vw,6.5rem)] leading-[0.95] font-semibold tracking-[-0.045em]">
            <span className="block animate-revelar" style={{ animationDelay: "80ms" }}>
              Você sabe <br className="sm:hidden" />o que fez.
            </span>
            <span className="block animate-revelar text-cinza-quente" style={{ animationDelay: "200ms" }}>
              Agora, saiba contar.
            </span>
          </h1>
          <div
            className="mt-12 grid animate-revelar gap-8 sm:mt-16 lg:ml-[38%]"
            style={{ animationDelay: "360ms" }}
          >
            <p className="max-w-[44ch] text-lg leading-relaxed text-osso/90 sm:text-xl">
              O Phronix transforma seu currículo e a vaga em um roteiro curto, ensaiado e à mão na hora da entrevista.
              Respostas no seu tom, ligadas a casos reais, para falar em 30 segundos.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <BotaoComecar />
              <span className="text-sm text-cinza-quente">Primeiro kit grátis, sem cartão.</span>
            </div>
          </div>
        </section>

        {/* 2. O problema */}
        <section className="border-y border-fio">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <Revelar>
              <h2 className="max-w-[14ch] font-display text-display-lg font-medium text-balance">
                Travar não é falta de experiência.
              </h2>
            </Revelar>
            <Revelar atraso={120} className="lg:pt-3">
              <p className="max-w-[42ch] text-xl leading-relaxed text-cinza-quente">
                Você fez o trabalho. Na hora de contar, a resposta sai longa, sem número e sem ligação com a vaga.{" "}
                <span className="text-osso">É isso que custa a próxima etapa.</span>
              </p>
            </Revelar>
          </div>
        </section>

        {/* 3. Como funciona */}
        <section id="como-funciona" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 pt-24 sm:px-8 sm:pt-36">
          <Revelar>
            <h2 className="max-w-[18ch] font-display text-display-lg font-medium text-balance">
              Do currículo à entrevista, em três passos.
            </h2>
          </Revelar>
          <Passos />
        </section>

        {/* 4. Demo da Hora do Show */}
        <section aria-labelledby="titulo-demo" className="bg-palco">
          <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-24 sm:px-8 sm:pt-20 sm:pb-32">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
              <Revelar>
                <h2 id="titulo-demo" className="font-display text-display-lg font-medium text-balance">
                  Na hora H, só o que você vai falar.
                </h2>
              </Revelar>
              <Revelar atraso={120}>
                <p className="max-w-[44ch] text-lg leading-relaxed text-cinza-quente">
                  Abra ao lado do Meet, do Zoom ou do Teams. Digite duas letras, a pergunta aparece. Bata o olho no
                  gancho e nas três âncoras e volte para a câmera.
                </p>
              </Revelar>
            </div>
            <Revelar className="mt-12">
              <p className="mb-3 text-rotulo text-cinza-quente">
                Experimente: clique na tela e use <kbd className="text-osso">/</kbd> para buscar,{" "}
                <kbd className="text-osso">↑ ↓</kbd> para navegar e <kbd className="text-osso">A</kbd> para ver só as
                âncoras.
              </p>
              <DemoShow />
            </Revelar>
            <p className="mt-6 max-w-[62ch] text-sm text-cinza-quente">
              É um roteiro pessoal: o Phronix não escuta nem grava a chamada. Alguns testes técnicos proíbem consulta;
              respeite as regras do processo.
            </p>
          </div>
        </section>

        {/* 5. Verdade: seção invertida, Osso com texto Noite; Fênix só em bloco. */}
        <section className="bg-osso text-noite">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-24 sm:px-8 sm:py-36 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <Revelar>
              <span aria-hidden className="block h-2 w-16 bg-fenix" />
              <h2 className="mt-8 max-w-[14ch] font-display text-display-lg font-semibold text-balance">
                A IA não inventa nada sobre você.
              </h2>
            </Revelar>
            <Revelar atraso={120} className="lg:pt-16">
              <p className="max-w-[44ch] text-xl leading-relaxed">
                Nenhuma empresa, projeto, tecnologia ou número que não esteja no seu currículo ou na conversa. Quando falta
                um dado, ele aparece marcado para você confirmar antes de usar.
              </p>
              <p aria-hidden className="mt-10 border-t border-noite/15 pt-6 text-lg">
                Fiz o curso{" "}
                <span className="rounded-[2px] border border-noite/40 px-1.5 py-0.5 font-medium">
                  confirmar: nome do curso
                </span>{" "}
                no último mês.
              </p>
            </Revelar>
          </div>
        </section>

        {/* 6. Planos */}
        <section id="planos" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 py-24 sm:px-8 sm:py-36">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <Revelar>
              <h2 className="max-w-[16ch] font-display text-display-lg font-medium text-balance">
                Comece grátis. Pague quando a entrevista for marcada.
              </h2>
            </Revelar>
            <Revelar atraso={120} className="lg:pt-3">
              <p className="max-w-[42ch] text-lg leading-relaxed text-cinza-quente">
                Busca de emprego vem em ondas. Por isso existe o kit avulso, além da assinatura para quem está em vários
                processos.
              </p>
            </Revelar>
          </div>
          <ul className="mt-14 border-t border-fio">
            {PLANOS.map((p, i) => (
              <Revelar
                key={p.id}
                como="li"
                atraso={i * 80}
                className="grid gap-x-8 gap-y-1 border-b border-fio py-6 sm:grid-cols-[12rem_1fr_auto] sm:items-baseline"
              >
                <span className="font-display text-xl font-medium">{p.nome}</span>
                <span className="text-cinza-quente">{p.inclui}</span>
                <span className="whitespace-nowrap sm:text-right">
                  <span className="font-display text-2xl font-medium tabular-nums">{p.preco}</span>
                  {p.periodo && <span className="text-sm text-cinza-quente">{p.periodo}</span>}
                  {p.nota && <span className="block text-rotulo text-cinza-quente">{p.nota}</span>}
                </span>
              </Revelar>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <BotaoComecar />
            <span className="text-rotulo text-cinza-quente">Preços de teste do beta.</span>
          </div>
        </section>

        {/* 7. FAQ */}
        <section className="border-t border-fio">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <Revelar>
              <h2 className="font-display text-display-lg font-medium">Perguntas frequentes</h2>
            </Revelar>
            <div className="border-t border-fio">
              {FAQ.map((f) => (
                <details key={f.pergunta} className="group border-b border-fio">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
                    {f.pergunta}
                    <span
                      aria-hidden
                      className="text-cinza-quente transition-transform duration-300 ease-brasa group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-[60ch] pb-6 leading-relaxed text-cinza-quente">{f.resposta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Chamada final: o único gradiente da paleta, como luz de palco. */}
        <section className="relative overflow-hidden border-t border-fio">
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-1/2 left-1/2 h-[42rem] w-[70rem] max-w-[160vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(255_90_31/0.38),rgb(255_193_77/0.14)_55%,transparent)] blur-2xl"
          />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-32 text-left sm:px-8 sm:py-44">
            <Revelar>
              <h2 className="font-display text-[clamp(2.5rem,1rem+5.6vw,6rem)] leading-[0.95] font-semibold tracking-[-0.045em]">
                <span className="lg:block">Sua próxima entrevista </span>
                <span className="lg:block">merece um roteiro.</span>
              </h2>
            </Revelar>
            <Revelar atraso={160} className="mt-12">
              <BotaoComecar grande />
            </Revelar>
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
