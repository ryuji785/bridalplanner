"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MilestoneForm } from "@/components/schedule/milestone-form";
import { createDefaultMilestones } from "@/actions/milestone-actions";
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  Plus,
  FileText,
  Loader2,
} from "lucide-react";

interface ScheduleHeaderProps {
  weddingId: string;
  weddingDate: string;
  totalMilestones: number;
  completedCount: number;
  overdueCount: number;
  hasMilestones: boolean;
}

export function ScheduleHeader({
  weddingId,
  weddingDate,
  totalMilestones,
  completedCount,
  overdueCount,
  hasMilestones,
}: ScheduleHeaderProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreateTemplate() {
    if (hasMilestones) {
      if (
        !confirm(
          "既存のマイルストーンに加えて、テンプレートのマイルストーンが追加されます。よろしいですか？"
        )
      ) {
        return;
      }
    }

    startTransition(async () => {
      await createDefaultMilestones(weddingId, weddingDate);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">スケジュール管理</h1>
          <p className="text-muted-foreground">
            結婚式までのマイルストーンとタスクを管理します
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCreateTemplate}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            テンプレートから作成
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            マイルストーンを追加
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">全マイルストーン</p>
              <p className="text-2xl font-bold">{totalMilestones}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-100 p-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">完了</p>
              <p className="text-2xl font-bold">{completedCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-red-100 p-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">期限超過</p>
              <p className="text-2xl font-bold">{overdueCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <MilestoneForm
        weddingId={weddingId}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
