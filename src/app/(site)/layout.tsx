import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from "next/font/google";
import { funnelDisplay, funnelSans } from "../fontes";

// A demo da landing é a Hora do Show de verdade, com a fonte dela.
const atkinson = Atkinson_Hyperlegible_Next({ variable: "--font-atkinson", subsets: ["latin", "latin-ext"] });
const atkinsonMono = Atkinson_Hyperlegible_Mono({ variable: "--font-atkinson-mono", subsets: ["latin"] });

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div
      className={`${funnelDisplay.variable} ${funnelSans.variable} ${atkinson.variable} ${atkinsonMono.variable} grain relative flex min-h-dvh flex-1 flex-col bg-noite font-app text-osso`}
    >
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
