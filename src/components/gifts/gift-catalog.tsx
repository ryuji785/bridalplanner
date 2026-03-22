"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GiftForm } from "./gift-form";
import { deleteGift } from "@/actions/gift-actions";
import { formatYen } from "@/lib/utils";

type Gift = {
  id: string;
  name: string;
  category: string | null;
  unitPrice: number;
  supplier: string | null;
  note: string | null;
};

const categoryLabels: Record<string, string> = {
  main: "メイン記念品",
  sweets: "引菓子",
  petite: "プチギフト",
};

const categoryColors: Record<string, string> = {
  main: "border-blue-300 bg-blue-100 text-blue-800",
  sweets: "border-orange-300 bg-orange-100 text-orange-800",
  petite: "border-green-300 bg-green-100 text-green-800",
};

type Props = {
  gifts: Gift[];
  weddingId: string;
};

export function GiftCatalog({ gifts, weddingId }: Props) {
  const [editingGift, setEditingGift] = useState<Gift | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleEdit(gift: Gift) {
    setEditingGift(gift);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditingGift(undefined);
    setFormOpen(true);
  }

  function handleDelete(giftId: string) {
    if (!confirm("このギフトを削除しますか？")) return;
    startTransition(async () => {
      await deleteGift(giftId);
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleAdd}>ギフトを追加</Button>
      </div>

      {gifts.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="mb-2 text-lg">ギフトがまだ登録されていません</p>
          <p className="text-sm">
            ギフトを追加して引き出物カタログを作成してください。
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-medium">ギフト名</th>
                <th className="p-3 text-left text-sm font-medium">カテゴリ</th>
                <th className="p-3 text-right text-sm font-medium">単価</th>
                <th className="p-3 text-left text-sm font-medium">仕入先</th>
                <th className="p-3 text-right text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((gift) => (
                <tr key={gift.id} className="border-b last:border-b-0">
                  <td className="p-3">
                    <div>
                      <span className="font-medium">{gift.name}</span>
                      {gift.note ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {gift.note}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-3">
                    {gift.category ? (
                      <Badge
                        variant="outline"
                        className={categoryColors[gift.category] ?? ""}
                      >
                        {categoryLabels[gift.category] ?? gift.category}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">未設定</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatYen(gift.unitPrice)}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {gift.supplier ?? "-"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(gift)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(gift.id)}
                        disabled={isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        削除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <GiftForm
        weddingId={weddingId}
        gift={editingGift}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
