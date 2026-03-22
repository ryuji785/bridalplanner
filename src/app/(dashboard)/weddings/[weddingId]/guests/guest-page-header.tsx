"use client";

import { useState } from "react";
import { Download, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { GuestForm } from "@/components/guests/guest-form";
import { GuestCsvDialog } from "@/components/guests/guest-csv-dialog";

type GuestPageHeaderProps = {
  weddingId: string;
};

export function GuestPageHeader({ weddingId }: GuestPageHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ゲスト管理</h1>
        <p className="text-sm text-muted-foreground">
          招待ゲストの登録、編集、CSV入出力を行います。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <a href={`/api/weddings/${weddingId}/guests/export`}>
            <Download className="mr-2 h-4 w-4" />
            CSVエクスポート
          </a>
        </Button>
        <GuestCsvDialog weddingId={weddingId} />
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          ゲストを追加
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {dialogOpen ? (
          <GuestForm
            weddingId={weddingId}
            onClose={() => setDialogOpen(false)}
          />
        ) : null}
      </Dialog>
    </div>
  );
}
