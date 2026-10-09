import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

// Cache Components fica desligado: o route handler do Serwist (src/app/serwist)
// usa route segment config (`dynamic`, `revalidate`), que não convive com ele.
const nextConfig: NextConfig = {
  // Em dev, o Next só libera os scripts para localhost. Para testar pelo IP da
  // rede (ex.: no celular), o IP precisa estar aqui; sem isso a página não
  // hidrata e os formulários não fazem nada. Não afeta produção.
  allowedDevOrigins: ["192.168.3.235"],
  // Rotas antigas, para links salvos e PWAs já instalados.
  async redirects() {
    return [
      { source: "/preparacoes", destination: "/painel", permanent: true },
      { source: "/preparacoes/nova", destination: "/elaborar", permanent: true },
      { source: "/painel/nova-vaga", destination: "/elaborar", permanent: true },
      { source: "/comecar", destination: "/curriculo", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSerwist(nextConfig);
