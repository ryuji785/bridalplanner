"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SeatingPrintActions({ weddingId }: { weddingId: string }) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button onClick={() => window.print()}>印刷する</Button>
      <Button variant="outline" asChild>
        <Link href={`/weddings/${weddingId}/seating`}>編集画面に戻る</Link>
      </Button>
    </div>
  );
}
