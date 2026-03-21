"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SongForm } from "./song-form";
import {
  updateSection,
  deleteSection,
  deleteSong,
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

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  const sec = seconds % 60;
  if (hours > 0) {
    return `${hours}時間${min}分`;
  }
  return `${min}分${sec > 0 ? `${sec}秒` : ""}`;
}

type Props = {
  sections: Section[];
};

export function SectionList({ sections }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );
  const [songFormOpen, setSongFormOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | undefined>();
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sectionInputRef = useRef<HTMLInputElement>(null);

  function toggleSection(sectionId: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
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
    if (!confirm("この曲を削除しますか？")) return;
    startTransition(async () => {
      await deleteSong(songId);
    });
  }

  function handleDeleteSection(sectionId: string) {
    if (!confirm("このセクションと含まれる曲をすべて削除しますか？")) return;
    startTransition(async () => {
      await deleteSection(sectionId);
    });
  }

  function handleRenameSection(sectionId: string) {
    setEditingSectionId(sectionId);
    setTimeout(() => sectionInputRef.current?.focus(), 50);
  }

  function handleRenameSave(sectionId: string) {
    const name = sectionInputRef.current?.value;
    if (!name) return;

    const formData = new FormData();
    formData.set("name", name);

    startTransition(async () => {
      await updateSection(sectionId, formData);
      setEditingSectionId(null);
    });
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg mb-2">セクションがまだありません</p>
        <p className="text-sm">
          テンプレートセクションを作成するか、手動でセクションを追加してください
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
            (sum, s) => sum + (s.durationSec ?? 0),
            0
          );

          return (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="text-lg">
                        {isExpanded ? "▼" : "▶"}
                      </span>
                    </button>

                    {editingSectionId === section.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          ref={sectionInputRef}
                          defaultValue={section.name}
                          className="h-8 w-48"
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleRenameSave(section.id);
                            if (e.key === "Escape")
                              setEditingSectionId(null);
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
                        className="text-base cursor-pointer"
                        onClick={() => toggleSection(section.id)}
                      >
                        {section.name}
                      </CardTitle>
                    )}

                    <Badge variant="secondary" className="text-xs">
                      {section.songs.length}曲
                    </Badge>
                    {totalDuration > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {formatTotalDuration(totalDuration)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-1">
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

              {isExpanded && (
                <CardContent>
                  {section.songs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      曲がまだ追加されていません
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {section.songs.map((song, index) => (
                        <div
                          key={song.id}
                          className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm text-muted-foreground w-6 text-right shrink-0">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {song.title}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {song.artist}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {song.durationSec != null && (
                              <span className="text-sm text-muted-foreground font-mono">
                                {formatDuration(song.durationSec)}
                              </span>
                            )}
                            {song.note && (
                              <Badge
                                variant="outline"
                                className="text-xs max-w-[120px] truncate"
                              >
                                {song.note}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleEditSong(section.id, song)
                              }
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
              )}
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
