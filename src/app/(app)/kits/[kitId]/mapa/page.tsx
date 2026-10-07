import { Mapa } from "./_components/mapa";

export const metadata = { title: "Mapa" };

export default async function Page({ params }: PageProps<"/kits/[kitId]/mapa">) {
  const { kitId } = await params;
  return <Mapa kitId={kitId} />;
}
