"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TimelineEntryForm } from "./timeline-entry-form";
import { deleteTimelineEntry } from "@/actions/timeline-actions";
import { cn } from "@/lib/utils";

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

const categoryConfig: Record<string, { label: string; color: string }> = {
  preparation: {
    label: "準備",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  ceremony: {
    label: "挙式",
    color: "bg-purple-100 text-purple-800 border-purple-300",
  },
  reception: {
    label: "披露宴",
    color: "bg-pink-100 text-pink-800 border-pink-300",
  },
};

const categoryLineColor: Record<string, string> = {
  preparation: "bg-yellow-400",
  ceremony: "bg-purple-400",
  reception: "bg-pink-400",
};

type Props = {
  entries: TimelineEntry[];
  weddingId: string;
};

export function TimelineEditor({ entries, weddingId }: Props) {
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleEdit(entry: TimelineEntry) {
    setEditingEntry(entry);
    setFormOpen(true);
  }

  function handleDelete(entryId: string) {
    if (!confirm("このエントリーを削除しますか？")) return;
    startTransition(async () => {
      await deleteTimelineEntry(entryId);
    });
  }

  if (entries.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="mb-2 text-lg">タイムラインエントリーがありません</p>
        <p className="text-sm">
          テンプレートを追加するか、手動でエントリーを作成してください。
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <div className="absolute bottom-0 left-[4.5rem] top-0 w-0.5 bg-border" />

        <div className="space-y-0">
          {entries.map((entry) => {
            const category = entry.category ? categoryConfig[entry.category] : null;
            const lineColor = entry.category
              ? categoryLineColor[entry.category]
              : "bg-border";

            return (
              <div key={entry.id} className="relative flex gap-4 pb-6">
                <div className="w-16 shrink-0 pt-0.5 text-right font-mono text-sm">
                  <span className="font-semibold">{entry.startTime}</span>
                  {entry.endTime ? (
                    <div className="text-xs text-muted-foreground">
                      {entry.endTime}
                    </div>
                  ) : null}
                </div>

                <div className="relative z-10 shrink-0">
                  <div
                    className={cn(
                      "mt-1.5 h-3 w-3 rounded-full border-2 border-background",
                      lineColor
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1 rounded-lg border bg-card p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium">{entry.title}</h4>
                        {category ? (
                          <Badge
                            variant="outline"
                            className={cn("text-xs", category.color)}
                          >
                            {category.label}
                          </Badge>
                        ) : null}
                        {entry.location ? (
                          <Badge variant="secondary" className="text-xs">
                            {entry.location}
                          </Badge>
                        ) : null}
                      </div>
                      {entry.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entry.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        disabled={isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TimelineEntryForm
        weddingId={weddingId}
        entry={editingEntry}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
