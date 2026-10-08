import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

// Cache Components fica desligado: o route handler do Serwist (src/app/serwist)
// usa route segment config (`dynamic`, `revalidate`), que não convive com ele.
const nextConfig: NextConfig = {
  // Rotas antigas (antes do painel), para links salvos e PWAs já instalados.
  async redirects() {
    return [
      { source: "/preparacoes", destination: "/painel", permanent: true },
      { source: "/preparacoes/nova", destination: "/painel/nova-vaga", permanent: true },
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
