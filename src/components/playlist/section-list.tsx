"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SongForm } from "./song-form";
import {
  deleteSection,
  deleteSong,
  updateSection,
} from "@/actions/playlist-actions";

type Song = {
  id: string;
  title: string;
  artist: string;
  durationSec: number | null;
  note: string | null;
  sortOrder: number;
};

type Section = {
  id: string;
  name: string;
  sortOrder: number;
  songs: Song[];
};

type Props = {
  sections: Section[];
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${minutes}:${remain.toString().padStart(2, "0")}`;
}

function formatTotalDuration(seconds: number): string {
  if (seconds <= 0) return "";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}時間 ${minutes}分`;
  }

  if (minutes > 0) {
    return `${minutes}分`;
  }

  return `${seconds}秒`;
}

export function SectionList({ sections }: Props) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((section) => section.id))
  );
  const [songFormOpen, setSongFormOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | undefined>();
  const [activeSectionId, setActiveSectionId] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sectionInputRef = useRef<HTMLInputElement>(null);

  function toggleSection(sectionId: string) {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  function handleAddSong(sectionId: string) {
    setEditingSong(undefined);
    setActiveSectionId(sectionId);
    setSongFormOpen(true);
  }

  function handleEditSong(sectionId: string, song: Song) {
    setEditingSong(song);
    setActiveSectionId(sectionId);
    setSongFormOpen(true);
  }

  function handleDeleteSong(songId: string) {
    if (!confirm("この曲を削除しますか？")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteSong(songId);
      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleDeleteSection(sectionId: string) {
    if (!confirm("このセクションと中にある曲を削除しますか？")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteSection(sectionId);
      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleRenameSection(sectionId: string) {
    setEditingSectionId(sectionId);
    setTimeout(() => sectionInputRef.current?.focus(), 50);
  }

  function handleRenameSave(sectionId: string) {
    const name = sectionInputRef.current?.value?.trim();
    if (!name) return;

    const formData = new FormData();
    formData.set("name", name);

    startTransition(async () => {
      const result = await updateSection(sectionId, formData);
      if (result.success) {
        setEditingSectionId(null);
        router.refresh();
      }
    });
  }

  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
        <p className="mb-2 text-lg font-medium">
          セクションがまだ作成されていません
        </p>
        <p className="text-sm">
          テンプレート追加またはセクション追加からプレイリストを作成できます。
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const totalDuration = section.songs.reduce(
            (sum, song) => sum + (song.durationSec ?? 0),
            0
          );

          return (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="text-lg text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {isExpanded ? "▾" : "▸"}
                    </button>

                    {editingSectionId === section.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          ref={sectionInputRef}
                          defaultValue={section.name}
                          className="h-8 w-48"
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              handleRenameSave(section.id);
                            }
                            if (event.key === "Escape") {
                              setEditingSectionId(null);
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRenameSave(section.id)}
                        >
                          保存
                        </Button>
                      </div>
                    ) : (
                      <CardTitle
                        className="cursor-pointer text-base"
                        onClick={() => toggleSection(section.id)}
                      >
                        {section.name}
                      </CardTitle>
                    )}

                    <Badge variant="secondary" className="text-xs">
                      {section.songs.length} 曲
                    </Badge>
                    {totalDuration > 0 ? (
                      <Badge variant="outline" className="text-xs">
                        {formatTotalDuration(totalDuration)}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSong(section.id)}
                    >
                      曲を追加
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRenameSection(section.id)}
                    >
                      名前変更
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSection(section.id)}
                      disabled={isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      削除
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded ? (
                <CardContent>
                  {section.songs.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">
                      このセクションにはまだ曲がありません。
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {section.songs.map((song, index) => (
                        <div
                          key={song.id}
                          className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="w-6 shrink-0 text-right text-sm text-muted-foreground">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{song.title}</p>
                              <p className="truncate text-sm text-muted-foreground">
                                {song.artist}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {song.durationSec != null ? (
                              <span className="font-mono text-sm text-muted-foreground">
                                {formatDuration(song.durationSec)}
                              </span>
                            ) : null}
                            {song.note ? (
                              <Badge
                                variant="outline"
                                className="max-w-[120px] truncate text-xs"
                              >
                                {song.note}
                              </Badge>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSong(section.id, song)}
                            >
                              編集
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSong(song.id)}
                              disabled={isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              削除
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              ) : null}
            </Card>
          );
        })}
      </div>

      <SongForm
        sectionId={activeSectionId}
        song={editingSong}
        open={songFormOpen}
        onOpenChange={setSongFormOpen}
      />
    </>
  );
}
