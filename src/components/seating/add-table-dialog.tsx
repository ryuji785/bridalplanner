"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createTable } from "@/actions/seating-actions";
import { Circle, RectangleHorizontal } from "lucide-react";

const DEFAULT_NAMES = [
  "高砂",
  "親族",
  "友人",
  "会社",
  "上司",
  "恩師",
  "受付",
  "余興",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
];

type AddTableDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  existingTableCount: number;
  onDataChange: () => void;
};

function getSuggestedName(existingTableCount: number) {
  return existingTableCount < DEFAULT_NAMES.length
    ? DEFAULT_NAMES[existingTableCount]
    : `テーブル ${existingTableCount + 1}`;
}

export function AddTableDialog({
  open,
  onOpenChange,
  weddingId,
  existingTableCount,
  onDataChange,
}: AddTableDialogProps) {
  const [name, setName] = useState(getSuggestedName(existingTableCount));
  const [shape, setShape] = useState<"round" | "rectangle">("round");
  const [capacity, setCapacity] = useState(8);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setName(getSuggestedName(existingTableCount));
      setShape("round");
      setCapacity(8);
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await createTable(weddingId, {
        name: name.trim(),
        shape,
        capacity,
      });

      if (result.success) {
        onDataChange();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>テーブルを追加</DialogTitle>
          <DialogDescription>
            新しいテーブルの設定を入力してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="table-name">テーブル名</Label>
            <Input
              id="table-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例: 親族 / テーブル1"
            />
          </div>

          <div className="space-y-2">
            <Label>テーブル形状</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShape("round")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                  shape === "round"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Circle className="h-8 w-8" />
                <span className="text-sm font-medium">円卓</span>
              </button>
              <button
                type="button"
                onClick={() => setShape("rectangle")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                  shape === "rectangle"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <RectangleHorizontal className="h-8 w-8" />
                <span className="text-sm font-medium">長卓</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="table-capacity">席数</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCapacity(Math.max(2, capacity - 1))}
                disabled={capacity <= 2}
              >
                -
              </Button>
              <Input
                id="table-capacity"
                type="number"
                min={2}
                max={20}
                value={capacity}
                onChange={(event) =>
                  setCapacity(
                    Math.max(2, Math.min(20, parseInt(event.target.value, 10) || 2))
                  )
                }
                className="h-8 w-16 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCapacity(Math.min(20, capacity + 1))}
                disabled={capacity >= 20}
              >
                +
              </Button>
              <span className="text-sm text-muted-foreground">名</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {isPending ? "追加中..." : "追加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
