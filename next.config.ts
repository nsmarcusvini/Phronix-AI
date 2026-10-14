import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

// Cache Components fica desligado: o route handler do Serwist (src/app/serwist)
// usa route segment config (`dynamic`, `revalidate`), que não convive com ele.
const nextConfig: NextConfig = {
  // Em dev, o Next só libera os scripts para localhost. Aberto pelo IP da rede
  // (ex.: no celular), a página não hidrata e os formulários não fazem nada.
  // Libera as faixas de rede local inteiras, porque o IP muda com o roteador
  // (já foi 192.168.3.x e 192.168.15.x). Não afeta produção.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
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
