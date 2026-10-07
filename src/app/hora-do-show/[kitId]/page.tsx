import { HoraDoShow } from "../_components/hora-do-show";

export const metadata = { title: "Hora do Show" };

export default async function Page({ params }: PageProps<"/hora-do-show/[kitId]">) {
  const { kitId } = await params;
  return <HoraDoShow kitId={kitId} />;
}
