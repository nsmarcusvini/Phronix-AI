import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Phronix AI",
    short_name: "Phronix",
    description: "Seu roteiro de entrevista, ensaiado e à mão na hora do show.",
    lang: "pt-BR",
    start_url: "/painel",
    display: "standalone",
    background_color: "#0c0c0e",
    theme_color: "#0c0c0e",
    // TODO: ícones PNG 192 e 512 (maskable) quando o logo for definido.
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
