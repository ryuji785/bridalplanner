"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { createDefaultSections, createSection } from "@/actions/playlist-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PlaylistPageHeaderProps = {
  weddingId: string;
  sectionCount: number;
  songCount: number;
  totalDuration: string;
};

export function PlaylistPageHeader({
  weddingId,
  sectionCount,
  songCount,
  totalDuration,
}: PlaylistPageHeaderProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreateTemplate() {
    if (
      sectionCount > 0 &&
      !confirm("既存のセクションにテンプレートを追加しますか？")
    ) {
      return;
    }

    startTransition(async () => {
      const result = await createDefaultSections(weddingId);
      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleCreateSection(formData: FormData) {
    startTransition(async () => {
      const result = await createSection(weddingId, formData);
      if (result.success) {
        setDialogOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">音楽プレイリスト</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{sectionCount} セクション</Badge>
            <Badge variant="secondary">{songCount} 曲</Badge>
            {totalDuration ? (
              <Badge variant="outline">{totalDuration}</Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleCreateTemplate}
            disabled={isPending}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isPending ? "追加中..." : "テンプレート追加"}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            セクション追加
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>セクションを追加</DialogTitle>
            <DialogDescription>
              シーンごとに楽曲を整理するためのセクションを作成します。
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreateSection} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-section-name">セクション名</Label>
              <Input
                id="playlist-section-name"
                name="name"
                placeholder="例: 迎賓、乾杯、送賓"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "追加中..." : "追加する"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
