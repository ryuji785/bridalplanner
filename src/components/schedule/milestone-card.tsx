"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TaskChecklist } from "./task-checklist";
import { deleteMilestone } from "@/actions/milestone-actions";
import { formatDate, daysUntil, cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Building2,
  Shirt,
  Mail,
  UtensilsCrossed,
  Flower2,
  Camera,
  Music,
  Gift,
  MoreHorizontal,
  Loader2,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  done: boolean;
  assignee: string | null;
  note: string | null;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  status: string;
  category: string | null;
  tasks: Task[];
}

interface MilestoneCardProps {
  milestone: Milestone;
  onEdit: (milestone: Milestone) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  "会場": <Building2 className="h-4 w-4" />,
  "衣装": <Shirt className="h-4 w-4" />,
  "招待状": <Mail className="h-4 w-4" />,
  "料理": <UtensilsCrossed className="h-4 w-4" />,
  "装花": <Flower2 className="h-4 w-4" />,
  "写真": <Camera className="h-4 w-4" />,
  "音楽": <Music className="h-4 w-4" />,
  "引き出物": <Gift className="h-4 w-4" />,
  "その他": <MoreHorizontal className="h-4 w-4" />,
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "未着手", variant: "outline" },
  in_progress: { label: "進行中", variant: "default" },
  done: { label: "完了", variant: "secondary" },
};

export function MilestoneCard({ milestone, onEdit }: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const doneCount = milestone.tasks.filter((t) => t.done).length;
  const totalCount = milestone.tasks.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const days = daysUntil(milestone.dueDate);
  const isOverdue = days < 0 && milestone.status !== "done";
  const isUpcoming = days >= 0 && days <= 14 && milestone.status !== "done";
  const isDone = milestone.status === "done";

  const timelineColor = isOverdue
    ? "bg-red-500"
    : isDone
    ? "bg-green-500"
    : isUpcoming
    ? "bg-yellow-500"
    : "bg-blue-500";

  function handleDelete() {
    if (!confirm("このマイルストーンを削除しますか？関連するタスクもすべて削除されます。")) return;
    startTransition(async () => {
      await deleteMilestone(milestone.id);
    });
  }

  return (
    <div className="flex gap-4">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div className={cn("h-4 w-4 rounded-full border-2 border-background shadow", timelineColor)} />
        <div className="w-0.5 flex-1 bg-border" />
      </div>

      {/* Card */}
      <Card
        className={cn(
          "mb-4 flex-1 transition-shadow hover:shadow-md",
          isOverdue && "border-red-300",
          isDone && "border-green-300 opacity-80"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {milestone.category && categoryIcons[milestone.category] && (
                <span className="text-muted-foreground">
                  {categoryIcons[milestone.category]}
                </span>
              )}
              <h3 className={cn("font-semibold", isDone && "line-through text-muted-foreground")}>
                {milestone.title}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant={statusConfig[milestone.status]?.variant ?? "outline"}>
                {statusConfig[milestone.status]?.label ?? milestone.status}
              </Badge>
              {milestone.category && (
                <Badge variant="outline" className="text-xs">
                  {milestone.category}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{formatDate(milestone.dueDate)}</span>
            {isOverdue && (
              <span className="font-medium text-red-600">
                {Math.abs(days)}日超過
              </span>
            )}
            {!isOverdue && !isDone && (
              <span className={cn(isUpcoming && "font-medium text-yellow-600")}>
                あと{days}日
              </span>
            )}
          </div>

          {milestone.description && (
            <p className="text-sm text-muted-foreground">{milestone.description}</p>
          )}

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="flex items-center gap-3">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {doneCount}/{totalCount} ({progress}%)
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground"
            >
              {expanded ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  タスクを閉じる
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  タスクを表示 ({totalCount})
                </>
              )}
            </Button>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(milestone)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {expanded && (
            <div className="mt-3 border-t pt-3">
              <TaskChecklist tasks={milestone.tasks} milestoneId={milestone.id} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
