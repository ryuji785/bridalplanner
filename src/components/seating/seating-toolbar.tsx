"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Wand2, RotateCcw, Table2 } from "lucide-react";
import { autoAssignGuests, clearAllAssignments } from "@/actions/seating-actions";
import { AddTableDialog } from "./add-table-dialog";
import type { SeatingData } from "@/actions/seating-actions";

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

  const handleAutoAssign = () => {
    if (
      !confirm(
        "未配置のゲストを自動でテーブルに割り当てます。続行しますか？"
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await autoAssignGuests(weddingId);
      if (result.success) {
        onDataChange();
      }
    });
  };

  const handleReset = () => {
    if (
      !confirm(
        "すべての席割り当てをリセットします。この操作は元に戻せません。続行しますか？"
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await clearAllAssignments(weddingId);
      if (result.success) {
        onDataChange();
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2 border-b bg-white p-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            テーブルを追加
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
            リセット
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Table2 className="h-3.5 w-3.5" />
            <span>テーブル</span>
            <Badge variant="secondary" className="h-5 text-xs">
              {totalTables}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span>配置済み</span>
            <Badge
              variant="secondary"
              className="h-5 bg-green-100 text-xs text-green-700"
            >
              {totalAssigned}名
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span>未配置</span>
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
