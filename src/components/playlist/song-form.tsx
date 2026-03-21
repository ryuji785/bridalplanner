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
import { createSong, updateSong } from "@/actions/playlist-actions";

type Song = {
  id: string;
  title: string;
  artist: string;
  durationSec: number | null;
  note: string | null;
};

type Props = {
  sectionId: string;
  song?: Song;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function SongForm({ sectionId, song, open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const isEditing = !!song;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateSong(song.id, formData)
        : await createSong(sectionId, formData);

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
            {isEditing ? "曲を編集" : "曲を追加"}
          </DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">曲名 *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={song?.title ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">アーティスト *</Label>
            <Input
              id="artist"
              name="artist"
              defaultValue={song?.artist ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationSec">再生時間（mm:ss）</Label>
            <Input
              id="durationSec"
              name="durationSec"
              placeholder="3:45"
              defaultValue={song ? formatDuration(song.durationSec) : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">メモ</Label>
            <Textarea
              id="note"
              name="note"
              defaultValue={song?.note ?? ""}
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
