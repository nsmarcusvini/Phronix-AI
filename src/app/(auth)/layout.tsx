import Link from "next/link";
import { funnelDisplay, funnelSans } from "../fontes";

// Login e recuperação de senha, na direção "Trilha".
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div
      className={`${funnelDisplay.variable} ${funnelSans.variable} grain relative flex min-h-dvh flex-1 flex-col bg-noite font-app text-osso`}
    >
      <div className="relative z-10 flex flex-1 flex-col">
        <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-8">
          {/* Logo pendente: wordmark provisório. */}
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            Phronix
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}
