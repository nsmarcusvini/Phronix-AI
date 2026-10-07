import type { Viewport } from "next";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from "next/font/google";

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin", "latin-ext"],
});

const atkinsonMono = Atkinson_Hyperlegible_Mono({
  variable: "--font-atkinson-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  viewportFit: "cover",
};

// Exceção consciente: fundo Palco (#000), uma família só, movimento quase zero.
export default function HoraDoShowLayout({ children }: LayoutProps<"/hora-do-show">) {
  return (
    <div
      className={`${atkinson.variable} ${atkinsonMono.variable} flex min-h-dvh flex-1 flex-col bg-palco font-show text-osso`}
    >
      {children}
    </div>
  );
}
