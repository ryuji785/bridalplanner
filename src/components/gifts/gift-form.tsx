"use client";

import { useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createGift, updateGift } from "@/actions/gift-actions";

const NO_CATEGORY = "__none";

type Gift = {
  id: string;
  name: string;
  category: string | null;
  unitPrice: number;
  supplier: string | null;
  note: string | null;
};

type Props = {
  weddingId: string;
  gift?: Gift;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GiftForm({ weddingId, gift, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!gift;

  function handleSubmit(formData: FormData) {
    if (formData.get("category") === NO_CATEGORY) {
      formData.set("category", "");
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateGift(gift.id, formData)
        : await createGift(weddingId, formData);

      if (result.success) {
        onOpenChange(false);
        formRef.current?.reset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "ギフトを編集" : "ギフトを追加"}</DialogTitle>
        </DialogHeader>
        <form
          key={gift?.id ?? "new"}
          ref={formRef}
          action={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">ギフト名 *</Label>
            <Input id="name" name="name" defaultValue={gift?.name ?? ""} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">カテゴリ</Label>
            <Select name="category" defaultValue={gift?.category ?? NO_CATEGORY}>
              <SelectTrigger id="category">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>未設定</SelectItem>
                <SelectItem value="main">メイン記念品</SelectItem>
                <SelectItem value="sweets">引き菓子</SelectItem>
                <SelectItem value="petite">プチギフト</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitPrice">単価（円） *</Label>
            <Input
              id="unitPrice"
              name="unitPrice"
              type="number"
              min={0}
              defaultValue={gift?.unitPrice ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">仕入先</Label>
            <Input
              id="supplier"
              name="supplier"
              defaultValue={gift?.supplier ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">メモ</Label>
            <Textarea
              id="note"
              name="note"
              defaultValue={gift?.note ?? ""}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "保存中..." : isEditing ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
