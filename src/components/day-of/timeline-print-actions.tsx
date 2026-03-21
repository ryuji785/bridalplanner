"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function TimelinePrintActions({ weddingId }: { weddingId: string }) {
  return (
    <div className="print:hidden flex flex-wrap gap-2">
      <Button onClick={() => window.print()}>印刷する</Button>
      <Button variant="outline" asChild>
        <Link href={`/weddings/${weddingId}/day-of`}>編集画面に戻る</Link>
      </Button>
    </div>
  );
}
