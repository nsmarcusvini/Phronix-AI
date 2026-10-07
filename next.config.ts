import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

// Cache Components fica desligado: o route handler do Serwist (src/app/serwist)
// usa route segment config (`dynamic`, `revalidate`), que não convive com ele.
const nextConfig: NextConfig = {
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
