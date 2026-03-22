"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSong, updateSong } from "@/actions/playlist-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

function formatDuration(seconds: number | null) {
  if (seconds == null) return "";
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${minutes}:${remain.toString().padStart(2, "0")}`;
}

export function SongForm({ sectionId, song, open, onOpenChange }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(song);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateSong(song!.id, formData)
        : await createSong(sectionId, formData);

      if (result.success) {
        onOpenChange(false);
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "曲を編集" : "曲を追加"}</DialogTitle>
        </DialogHeader>
        <form
          key={song?.id ?? "new"}
          ref={formRef}
          action={handleSubmit}
          className="space-y-4"
        >
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
            <Label htmlFor="durationSec">再生時間（m:ss）</Label>
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
              {isPending ? "保存中..." : isEditing ? "更新する" : "追加する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
