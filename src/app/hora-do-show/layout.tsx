// Exceção consciente: fundo Palco (#000), movimento quase zero.
export default function HoraDoShowLayout({ children }: LayoutProps<"/hora-do-show">) {
  return <div className="flex min-h-dvh flex-1 flex-col bg-palco">{children}</div>;
}
