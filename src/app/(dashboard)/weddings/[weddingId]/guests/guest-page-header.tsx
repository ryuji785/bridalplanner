"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { GuestForm } from "@/components/guests/guest-form";
import { UserPlus } from "lucide-react";

type GuestPageHeaderProps = {
  weddingId: string;
};

export function GuestPageHeader({ weddingId }: GuestPageHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ゲスト管理</h1>
        <p className="text-sm text-muted-foreground">
          招待ゲストの登録・管理を行います
        </p>
      </div>
      <Button onClick={() => setDialogOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        ゲストを追加
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {dialogOpen && (
          <GuestForm
            weddingId={weddingId}
            onClose={() => setDialogOpen(false)}
          />
        )}
      </Dialog>
    </div>
  );
}
