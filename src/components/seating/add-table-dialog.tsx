"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Circle, RectangleHorizontal, Trash2 } from "lucide-react";
import {
  createTable,
  deleteTable,
  updateTable,
  type SeatingTable,
} from "@/actions/seating-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_NAMES = [
  "親族席",
  "友人席",
  "会社関係",
  "上司席",
  "恩師席",
  "主賓席",
  "新郎親族",
  "新婦親族",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
] as const;

const MIN_CAPACITY = 2;
const MAX_CAPACITY = 20;

type EditableTable = Pick<SeatingTable, "id" | "name" | "shape" | "capacity">;

type AddTableDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  existingTableCount: number;
  onDataChange: () => void;
  table?: EditableTable;
  minCapacity?: number;
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
  table,
  minCapacity = MIN_CAPACITY,
}: AddTableDialogProps) {
  const [name, setName] = useState("");
  const [shape, setShape] = useState<"round" | "rectangle">("round");
  const [capacity, setCapacity] = useState(MIN_CAPACITY);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(table);

  const minimumCapacity = useMemo(
    () => Math.max(MIN_CAPACITY, minCapacity),
    [minCapacity]
  );

  useEffect(() => {
    if (!open) return;

    setErrorMessage(null);

    if (table) {
      setName(table.name);
      setShape(table.shape === "rectangle" ? "rectangle" : "round");
      setCapacity(Math.max(minimumCapacity, table.capacity));
      return;
    }

    setName(getSuggestedName(existingTableCount));
    setShape("round");
    setCapacity(Math.max(minimumCapacity, 8));
  }, [existingTableCount, minimumCapacity, open, table]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setErrorMessage(null);
    }

    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("テーブル名を入力してください。");
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      const result =
        isEditing && table
          ? await updateTable(table.id, {
              name: trimmedName,
              shape,
              capacity,
            })
          : await createTable(weddingId, {
              name: trimmedName,
              shape,
              capacity,
            });

      if (result.success) {
        onDataChange();
        onOpenChange(false);
      } else {
        setErrorMessage(result.error);
      }
    });
  }

  function handleDelete() {
    if (!table) return;

    if (
      !confirm(
        `「${table.name}」を削除しますか？割り当て済みの席もまとめて削除されます。`
      )
    ) {
      return;
    }

    startTransition(async () => {
      await deleteTable(table.id);
      onDataChange();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "テーブルを編集" : "テーブルを追加"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "テーブル名、形、収容人数を変更できます。"
              : "新しいテーブルの名前、形、収容人数を設定します。"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="table-name">テーブル名</Label>
            <Input
              id="table-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例: 親族席、友人席、テーブル1"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>テーブル形状</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShape("round")}
                disabled={isPending}
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
                disabled={isPending}
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
            <Label htmlFor="table-capacity">収容人数</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCapacity((current) => Math.max(minimumCapacity, current - 1))
                }
                disabled={isPending || capacity <= minimumCapacity}
              >
                -
              </Button>
              <Input
                id="table-capacity"
                type="number"
                min={minimumCapacity}
                max={MAX_CAPACITY}
                value={capacity}
                onChange={(event) =>
                  setCapacity(
                    Math.max(
                      minimumCapacity,
                      Math.min(
                        MAX_CAPACITY,
                        parseInt(event.target.value, 10) || minimumCapacity
                      )
                    )
                  )
                }
                className="h-8 w-20 text-center"
                disabled={isPending}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCapacity((current) => Math.min(MAX_CAPACITY, current + 1))
                }
                disabled={isPending || capacity >= MAX_CAPACITY}
              >
                +
              </Button>
              <span className="text-sm text-muted-foreground">名</span>
            </div>
            {minimumCapacity > MIN_CAPACITY ? (
              <p className="text-xs text-muted-foreground">
                すでに席割りがあるため、{minimumCapacity}名未満にはできません。
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {isEditing ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
                className="gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            ) : (
              <span />
            )}

            <DialogFooter className="gap-2 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing
                    ? "更新中..."
                    : "追加中..."
                  : isEditing
                    ? "更新する"
                    : "追加する"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
