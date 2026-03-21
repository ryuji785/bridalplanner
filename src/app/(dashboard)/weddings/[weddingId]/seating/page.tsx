import { requireWeddingAccess } from "@/lib/auth-helpers";
import { getSeatingData } from "@/actions/seating-actions";
import { FloorPlanCanvas } from "@/components/seating/floor-plan-canvas";

type Props = {
  params: { weddingId: string };
};

export default async function SeatingPage({ params }: Props) {
  await requireWeddingAccess(params.weddingId);

  const data = await getSeatingData(params.weddingId);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b px-4 py-3">
        <h1 className="text-xl font-bold">席次表</h1>
        <p className="text-sm text-muted-foreground">
          テーブルの配置とゲストの座席を管理します。
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <FloorPlanCanvas initialData={data} weddingId={params.weddingId} />
      </div>
    </div>
  );
}
