"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createDefaultTimeline } from "@/actions/timeline-actions";
import { TimelineEntryForm } from "@/components/day-of/timeline-entry-form";

type Props = {
  weddingId: string;
  entryCount: number;
  totalDuration: string;
  hasEntries: boolean;
};

export function TimelinePageHeader({
  weddingId,
  entryCount,
  totalDuration,
  hasEntries,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreateTemplate() {
    if (
      hasEntries &&
      !confirm("既存のタイムラインにテンプレートを追加しますか？")
    ) {
      return;
    }

    startTransition(async () => {
      await createDefaultTimeline(weddingId);
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">当日タイムライン</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">{entryCount} 件</Badge>
            {totalDuration ? <Badge variant="outline">{totalDuration}</Badge> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleCreateTemplate}
            disabled={isPending}
          >
            {isPending ? "追加中..." : "テンプレート追加"}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/weddings/${weddingId}/day-of/print`}>印刷ビュー</Link>
          </Button>
          <Button onClick={() => setFormOpen(true)}>エントリーを追加</Button>
        </div>
      </div>

      <TimelineEntryForm
        weddingId={weddingId}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
