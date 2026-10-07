import { Funnel_Display, Funnel_Sans } from "next/font/google";

const funnelDisplay = Funnel_Display({
  variable: "--font-funnel-display",
  subsets: ["latin", "latin-ext"],
});

const funnelSans = Funnel_Sans({
  variable: "--font-funnel-sans",
  subsets: ["latin", "latin-ext"],
});

// Direção "Trilha": Noite com grain, Funnel Display + Funnel Sans.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div
      className={`${funnelDisplay.variable} ${funnelSans.variable} grain relative flex min-h-dvh flex-1 flex-col bg-noite font-app text-osso`}
    >
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
