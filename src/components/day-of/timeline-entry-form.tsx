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
import {
  createTimelineEntry,
  updateTimelineEntry,
} from "@/actions/timeline-actions";

const NO_CATEGORY = "__none";

type TimelineEntry = {
  id: string;
  startTime: string;
  endTime: string | null;
  title: string;
  description: string | null;
  location: string | null;
  category: string | null;
  sortOrder: number;
};

type Props = {
  weddingId: string;
  entry?: TimelineEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TimelineEntryForm({
  weddingId,
  entry,
  open,
  onOpenChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!entry;

  function handleSubmit(formData: FormData) {
    if (formData.get("category") === NO_CATEGORY) {
      formData.set("category", "");
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateTimelineEntry(entry.id, formData)
        : await createTimelineEntry(weddingId, formData);

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
          <DialogTitle>
            {isEditing ? "エントリーを編集" : "エントリーを追加"}
          </DialogTitle>
        </DialogHeader>
        <form
          key={entry?.id ?? "new"}
          ref={formRef}
          action={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">開始時刻 *</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue={entry?.startTime ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">終了時刻</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                defaultValue={entry?.endTime ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={entry?.title ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={entry?.description ?? ""}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">場所</Label>
            <Input
              id="location"
              name="location"
              defaultValue={entry?.location ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">カテゴリ</Label>
            <Select name="category" defaultValue={entry?.category ?? NO_CATEGORY}>
              <SelectTrigger id="category">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>未設定</SelectItem>
                <SelectItem value="preparation">準備</SelectItem>
                <SelectItem value="ceremony">挙式</SelectItem>
                <SelectItem value="reception">披露宴</SelectItem>
              </SelectContent>
            </Select>
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
