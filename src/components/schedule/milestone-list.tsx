"use client";

import { useState } from "react";
import { MilestoneCard } from "./milestone-card";
import { MilestoneForm } from "./milestone-form";

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

interface MilestoneListProps {
  milestones: Milestone[];
  weddingId: string;
}

export function MilestoneList({ milestones, weddingId }: MilestoneListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    status: string;
    category: string;
  } | null>(null);

  function handleEdit(milestone: Milestone) {
    const dueDateStr =
      milestone.dueDate instanceof Date
        ? milestone.dueDate.toISOString().split("T")[0]
        : new Date(milestone.dueDate).toISOString().split("T")[0];

    setEditingMilestone({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description ?? "",
      dueDate: dueDateStr,
      status: milestone.status,
      category: milestone.category ?? "",
    });
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) {
      setEditingMilestone(null);
    }
  }

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          マイルストーンがまだありません
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          「マイルストーンを追加」または「テンプレートから作成」ボタンで始めましょう
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-0">
        {milestones.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            onEdit={handleEdit}
          />
        ))}
      </div>

      <MilestoneForm
        weddingId={weddingId}
        open={formOpen}
        onOpenChange={handleFormClose}
        initialData={editingMilestone}
      />
    </>
  );
}
