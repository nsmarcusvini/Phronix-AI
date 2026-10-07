import Link from "next/link";

// Kit real que já existe, mas ainda não tem respostas: o mapa sai da conversa.
export function KitSemMapa({ kitId }: { kitId: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-16 sm:px-8">
      <h1 className="font-display text-display-lg font-medium text-balance">O mapa deste kit ainda não foi gerado.</h1>
      <p className="mt-4 max-w-prose text-cinza-quente">
        Ele sai depois da conversa que encontra os seus casos. Termine a conversa e volte aqui.
      </p>
      <Link
        href={`/kits/${kitId}/conversa`}
        className="mt-10 inline-block rounded-[3px] bg-fenix px-7 py-3.5 font-semibold text-noite shadow-fenix transition-transform duration-200 ease-brasa hover:-translate-y-0.5 focus-visible:outline-osso"
      >
        Continuar a conversa
      </Link>
    </main>
  );
}
