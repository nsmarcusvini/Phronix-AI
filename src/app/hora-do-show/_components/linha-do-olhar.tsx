// O fio no topo marca a linha do olhar: o que importa fica logo abaixo dele,
// perto da webcam.
export function LinhaDoOlhar() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-fio">
      <span className="absolute top-0 left-1/2 size-1.5 -translate-x-1/2 rounded-b-full bg-cinza-quente" />
    </div>
  );
}
