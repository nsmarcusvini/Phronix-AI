// Dado que falta vira [confirmar: …], destacado em Âmbar até o usuário resolver.
export function ComMarcadores({ texto }: { texto: string }) {
  const partes = texto.split(/(\[confirmar:[^\]]*\])/g);
  return partes.map((parte, i) =>
    parte.startsWith("[confirmar:") ? (
      <mark
        key={i}
        className="bg-transparent text-ambar underline decoration-dotted underline-offset-4"
      >
        {parte}
      </mark>
    ) : (
      parte
    ),
  );
}
