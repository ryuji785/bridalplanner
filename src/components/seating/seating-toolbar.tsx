"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus, RotateCcw, Table2, Wand2 } from "lucide-react";
import { autoAssignGuests, clearAllAssignments } from "@/actions/seating-actions";
import type { SeatingData } from "@/actions/seating-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AddTableDialog } from "./add-table-dialog";

type SeatingToolbarProps = {
  weddingId: string;
  data: SeatingData;
  onDataChange: () => void;
};

export function SeatingToolbar({
  weddingId,
  data,
  onDataChange,
}: SeatingToolbarProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalTables = data.tables.length;
  const totalAssigned = data.tables.reduce(
    (sum, table) => sum + table.seatAssignments.length,
    0
  );
  const totalUnassigned = data.unassignedGuests.length;

  function handleAutoAssign() {
    if (!confirm("未配置のゲストを現在のテーブルに自動で割り当てますか？")) {
      return;
    }

    startTransition(async () => {
      const result = await autoAssignGuests(weddingId);
      if (result.success) {
        onDataChange();
      }
    });
  }

  function handleReset() {
    if (!confirm("すべての席割りを解除しますか？この操作は元に戻せません。")) {
      return;
    }

    startTransition(async () => {
      const result = await clearAllAssignments(weddingId);
      if (result.success) {
        onDataChange();
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            テーブル追加
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoAssign}
            disabled={isPending || totalUnassigned === 0 || totalTables === 0}
            className="gap-1.5"
          >
            <Wand2 className="h-4 w-4" />
            自動配置
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={isPending || totalAssigned === 0}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            割当リセット
          </Button>

          <Button size="sm" variant="outline" asChild>
            <Link href={`/weddings/${weddingId}/seating/print`}>印刷ビュー</Link>
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Table2 className="h-3.5 w-3.5" />
            <span>テーブル</span>
            <Badge variant="secondary" className="h-5 text-xs">
              {totalTables}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span>割当済み</span>
            <Badge
              variant="secondary"
              className="h-5 bg-green-100 text-xs text-green-700"
            >
              {totalAssigned}名
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span>未割当</span>
            <Badge
              variant={totalUnassigned > 0 ? "destructive" : "secondary"}
              className="h-5 text-xs"
            >
              {totalUnassigned}名
            </Badge>
          </div>
        </div>
      </div>

      <AddTableDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        weddingId={weddingId}
        existingTableCount={totalTables}
        onDataChange={onDataChange}
      />
    </>
  );
}
