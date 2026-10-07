import { Pratica } from "./_components/pratica";

export const metadata = { title: "Prática" };

export default async function Page({ params }: PageProps<"/kits/[kitId]/pratica">) {
  const { kitId } = await params;
  return <Pratica kitId={kitId} />;
}
