"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { createMilestone, updateMilestone } from "@/actions/milestone-actions";
import { CATEGORIES } from "@/lib/validators/milestone";
import { Loader2 } from "lucide-react";

interface MilestoneFormData {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  status: string;
  category: string;
}

interface MilestoneFormProps {
  weddingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: MilestoneFormData | null;
}

export function MilestoneForm({
  weddingId,
  open,
  onOpenChange,
  initialData,
}: MilestoneFormProps) {
  const isEditing = !!initialData?.id;
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "pending");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens with new data
  function resetForm() {
    setTitle(initialData?.title ?? "");
    setDescription(initialData?.description ?? "");
    setDueDate(initialData?.dueDate ?? "");
    setStatus(initialData?.status ?? "pending");
    setCategory(initialData?.category ?? "");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const data = {
      title,
      description: description || undefined,
      dueDate,
      status,
      category: category || undefined,
    };

    startTransition(async () => {
      try {
        if (isEditing && initialData?.id) {
          await updateMilestone(initialData.id, data);
        } else {
          await createMilestone(weddingId, data);
        }
        onOpenChange(false);
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (value) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "マイルストーンを編集" : "マイルストーンを追加"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "マイルストーンの内容を編集します"
              : "新しいマイルストーンを作成します"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="マイルストーンのタイトル"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="マイルストーンの説明（任意）"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">期日 *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">未着手</SelectItem>
                  <SelectItem value="in_progress">進行中</SelectItem>
                  <SelectItem value="done">完了</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">カテゴリ</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : isEditing ? (
                "更新する"
              ) : (
                "作成する"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
