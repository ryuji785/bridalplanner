"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toggleTask, deleteTask, createTask } from "@/actions/milestone-actions";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Task {
  id: string;
  title: string;
  done: boolean;
  assignee: string | null;
  note: string | null;
}

interface TaskChecklistProps {
  tasks: Task[];
  milestoneId: string;
}

export function TaskChecklist({ tasks, milestoneId }: TaskChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showInput, setShowInput] = useState(false);

  function handleToggle(taskId: string) {
    startTransition(async () => {
      await toggleTask(taskId);
    });
  }

  function handleDelete(taskId: string) {
    startTransition(async () => {
      await deleteTask(taskId);
    });
  }

  function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    startTransition(async () => {
      await createTask(milestoneId, { title: newTaskTitle.trim() });
      setNewTaskTitle("");
      setShowInput(false);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask();
    }
    if (e.key === "Escape") {
      setShowInput(false);
      setNewTaskTitle("");
    }
  }

  const assigneeLabel = (assignee: string | null) => {
    if (assignee === "planner") return "プランナー";
    if (assignee === "couple") return "おふたり";
    return null;
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
            task.done ? "bg-muted/50" : "hover:bg-muted/30"
          )}
        >
          <Checkbox
            checked={task.done}
            onCheckedChange={() => handleToggle(task.id)}
            disabled={isPending}
          />
          <span
            className={cn(
              "flex-1 text-sm",
              task.done && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </span>
          {task.assignee && (
            <Badge
              variant={task.assignee === "planner" ? "default" : "secondary"}
              className="text-xs"
            >
              {assigneeLabel(task.assignee)}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => handleDelete(task.id)}
            disabled={isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {showInput ? (
        <div className="flex items-center gap-2 px-3 py-1">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="タスク名を入力..."
            className="h-8 text-sm"
            autoFocus
            disabled={isPending}
          />
          <Button
            size="sm"
            className="h-8"
            onClick={handleAddTask}
            disabled={isPending || !newTaskTitle.trim()}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "追加"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => {
              setShowInput(false);
              setNewTaskTitle("");
            }}
          >
            取消
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="ml-3 text-muted-foreground"
          onClick={() => setShowInput(true)}
        >
          <Plus className="mr-1 h-3 w-3" />
          タスクを追加
        </Button>
      )}
    </div>
  );
}
