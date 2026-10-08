import type { Metadata } from "next";
import Link from "next/link";
import { PLANOS } from "@/lib/planos";
import { DemoShow } from "./_components/demo-show";
import { Ensaio } from "./_components/ensaio";
import { Revelar } from "./_components/revelar";
import { TelaConfirmar } from "./_components/telas";

/* Landing · direção "Ensaio" (/sites-incriveis)
   - A página é um ensaio geral em atos: a janela do produto nasce da luz do
     hero, fica presa na tela e a rolagem troca as telas reais dentro dela.
     No último ato a sala escurece e a janela vira a Hora do Show.
   - O único gradiente da paleta (Fênix → Âmbar) é a luz de onde a janela nasce.
   - Funnel Display em escala extrema; Osso só na seção da Verdade.
   - Copy literal de docs/landing-copy.md. */

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
      href="/criar-conta"
      className={`inline-block rounded-[3px] bg-fenix font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso ${
        grande ? "px-9 py-4 text-lg" : "px-7 py-3.5"
      }`}
    >
      Começar preparação grátis
    </Link>
  );
}

export default function Landing() {
  return (
    <>
      <header className="relative z-20 mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-8">
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
        {/* 1. Hero: a headline gigante e a luz de onde a janela do produto nasce. */}
        <section className="relative">
          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-12 sm:px-8 sm:pt-20">
            <h1 className="font-display text-[clamp(3rem,0.4rem+7.2vw,7rem)] leading-[0.9] font-semibold tracking-[-0.05em]">
              <span className="block animate-revelar">
                Você sabe <br className="sm:hidden" />o que fez.
              </span>
              <span className="block animate-revelar" style={{ animationDelay: "140ms" }}>
                Agora, saiba contar.
              </span>
            </h1>
            <div
              className="mt-10 grid animate-revelar gap-8 sm:mt-14 lg:ml-auto lg:w-[30rem]"
              style={{ animationDelay: "300ms" }}
            >
              <p className="text-lg leading-relaxed text-osso/85 sm:text-xl">
                O Phronix transforma seu currículo e a vaga em um roteiro curto, ensaiado e à mão na hora da entrevista.
                Respostas no seu tom, ligadas a casos reais, para falar em 30 segundos.
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <BotaoComecar />
                <p className="text-sm text-cinza-quente">
                  Para quem tem entrevista marcada.
                  <br />
                  Primeiro kit grátis, sem cartão.
                </p>
              </div>
            </div>
          </div>

          {/* A luz do palco: o único gradiente da paleta. */}
          <div aria-hidden className="pointer-events-none relative z-0 -mt-8 h-56 overflow-hidden sm:h-72">
            <div className="absolute bottom-[-60%] left-1/2 h-[140%] w-[min(110rem,180vw)] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(255_193_77/0.55),rgb(255_90_31/0.42)_38%,rgb(255_90_31/0.08)_70%,transparent)] blur-2xl" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgb(255_193_77/0.6),transparent)]" />
          </div>
        </section>

        {/* 2. Como funciona: os atos do ensaio. */}
        <section id="como-funciona" aria-label="Como funciona" className="relative scroll-mt-8">
          <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-8 sm:px-8 lg:pt-10 lg:pb-0">
            <h2 className="max-w-[18ch] font-display text-display-lg font-medium text-balance">
              Do currículo à entrevista, em três passos.
            </h2>
          </div>
          <Ensaio />
        </section>

        {/* 3. O problema: a frase que segura a respiração antes da demo. */}
        <section className="border-t border-fio bg-palco">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-28 sm:px-8 sm:py-40 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <Revelar>
              <h2 className="font-display text-[clamp(2.5rem,1rem+5vw,5.5rem)] leading-[0.95] font-semibold tracking-[-0.04em] text-balance">
                Travar não é falta de experiência.
              </h2>
            </Revelar>
            <Revelar atraso={120}>
              <p className="max-w-[42ch] text-xl leading-relaxed text-cinza-quente">
                Você fez o trabalho. Na hora de contar, a resposta sai longa, sem número e sem ligação com a vaga. É
                isso que custa a próxima etapa.
              </p>
            </Revelar>
          </div>
        </section>

        {/* 4. A Hora do Show de verdade. */}
        <section aria-labelledby="titulo-demo" className="bg-palco">
          <div className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-8 sm:pb-36">
            <div className="grid gap-6 border-t border-fio pt-16 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
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
              <p className="mb-3 text-sm text-cinza-quente">
                Clique na tela e use <kbd className="text-osso">/</kbd> para buscar,{" "}
                <kbd className="text-osso">↑ ↓</kbd> para navegar e <kbd className="text-osso">A</kbd> para ver só as
                âncoras.
              </p>
              <div className="rounded-xl shadow-[0_40px_140px_-50px_rgb(255_90_31/0.45)]">
                <DemoShow />
              </div>
            </Revelar>
            <p className="mt-6 max-w-[62ch] text-sm text-cinza-quente">
              É um roteiro pessoal: o Phronix não escuta nem grava a chamada. Alguns testes técnicos proíbem consulta;
              respeite as regras do processo.
            </p>
          </div>
        </section>

        {/* 5. Verdade: a única seção clara. Fênix só em bloco. */}
        <section className="overflow-hidden bg-osso text-noite">
          <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 py-28 sm:px-8 sm:py-40 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <Revelar>
              <span aria-hidden className="block h-2 w-20 bg-fenix" />
              <h2 className="mt-8 max-w-[12ch] font-display text-[clamp(2.5rem,1rem+4.4vw,5rem)] leading-[0.95] font-semibold tracking-[-0.04em] text-balance">
                A IA não inventa nada sobre você.
              </h2>
              <p className="mt-8 max-w-[42ch] text-lg leading-relaxed text-noite/80">
                Nenhuma empresa, projeto, tecnologia ou número que não esteja no seu currículo ou na conversa. Quando
                falta um dado, ele aparece marcado para você confirmar antes de usar.
              </p>
            </Revelar>
            <Revelar atraso={160} className="text-osso lg:-mr-24">
              <div className="rotate-[-2.5deg] rounded-xl shadow-[0_50px_120px_-40px_rgb(255_90_31/0.55)] transition-transform duration-700 ease-brasa hover:rotate-0">
                <TelaConfirmar />
              </div>
            </Revelar>
          </div>
        </section>

        {/* 6. Planos */}
        <section id="planos" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 py-28 sm:px-8 sm:py-40">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
            <Revelar>
              <h2 className="max-w-[14ch] font-display text-display-lg font-medium text-balance">
                Comece grátis. Pague quando a entrevista for marcada.
              </h2>
            </Revelar>
            <Revelar atraso={120}>
              <p className="max-w-[44ch] text-lg leading-relaxed text-cinza-quente">
                Busca de emprego vem em ondas. Por isso existe o kit avulso, além da assinatura para quem está em vários
                processos.
              </p>
            </Revelar>
          </div>
          <ul className="mt-16 border-t border-fio">
            {PLANOS.map((p, i) => (
              <Revelar
                key={p.id}
                como="li"
                atraso={i * 90}
                className="group grid gap-x-8 gap-y-1 border-b border-fio py-7 sm:grid-cols-[13rem_1fr_auto] sm:items-baseline"
              >
                <span className="font-display text-2xl font-medium">{p.nome}</span>
                <span className="text-cinza-quente">{p.inclui}</span>
                <span className="whitespace-nowrap sm:text-right">
                  <span className="font-display text-4xl font-semibold tabular-nums tracking-tight">{p.preco}</span>
                  {p.periodo && <span className="text-sm text-cinza-quente">{p.periodo}</span>}
                  {p.nota && <span className="block text-rotulo text-cinza-quente">{p.nota}</span>}
                </span>
              </Revelar>
            ))}
          </ul>
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
            <BotaoComecar />
            <span className="text-sm text-cinza-quente">Preços de teste do beta.</span>
          </div>
        </section>

        {/* 7. FAQ */}
        <section className="border-t border-fio">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-28 sm:px-8 sm:py-36 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
            <Revelar>
              <h2 className="font-display text-display-lg font-medium">Perguntas frequentes</h2>
            </Revelar>
            <div className="border-t border-fio">
              {FAQ.map((f) => (
                <details key={f.pergunta} className="group border-b border-fio">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-6 text-lg font-medium [&::-webkit-details-marker]:hidden">
                    {f.pergunta}
                    <span
                      aria-hidden
                      className="text-xl text-cinza-quente transition-transform duration-300 ease-brasa group-open:rotate-45"
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

        {/* 8. Chamada final */}
        <section className="border-t border-fio bg-palco">
          <div className="mx-auto w-full max-w-6xl px-4 py-32 sm:px-8 sm:py-48">
            <Revelar>
              <h2 className="font-display text-[clamp(2.75rem,0.8rem+6.4vw,7rem)] leading-[0.92] font-semibold tracking-[-0.05em]">
                <span className="lg:block">Sua próxima entrevista </span>
                <span className="lg:block">merece um roteiro.</span>
              </h2>
            </Revelar>
            <Revelar atraso={160} className="mt-14">
              <BotaoComecar grande />
            </Revelar>
          </div>
        </section>
      </main>

      <footer className="border-t border-fio bg-palco">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-8 text-sm text-cinza-quente sm:px-8">
          <span className="font-display font-semibold text-osso">Phronix AI</span>
          <span>Termos de uso e Política de privacidade (em breve)</span>
        </div>
      </footer>
    </>
  );
}
