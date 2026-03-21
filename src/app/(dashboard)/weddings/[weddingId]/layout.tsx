import { requireWeddingAccess } from "@/lib/auth-helpers";

export default async function WeddingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { weddingId: string };
}) {
  await requireWeddingAccess(params.weddingId);

  return <>{children}</>;
}
