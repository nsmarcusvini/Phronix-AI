import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next, Funnel_Display, Funnel_Sans } from "next/font/google";

const funnelDisplay = Funnel_Display({ variable: "--font-funnel-display", subsets: ["latin", "latin-ext"] });
const funnelSans = Funnel_Sans({ variable: "--font-funnel-sans", subsets: ["latin", "latin-ext"] });
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
