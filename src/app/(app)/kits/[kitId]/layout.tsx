import { NavKit } from "./_components/nav-kit";

export default async function KitLayout({ children, params }: LayoutProps<"/kits/[kitId]">) {
  const { kitId } = await params;
  return (
    <>
      <NavKit kitId={kitId} />
      {children}
    </>
  );
}
