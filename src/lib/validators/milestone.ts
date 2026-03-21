import { z } from "zod";

export const milestoneSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "期日を入力してください"),
  status: z.enum(["pending", "in_progress", "done"]).default("pending"),
  category: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").optional(),
  description: z.string().optional(),
  dueDate: z.string().min(1, "期日を入力してください").optional(),
  status: z.enum(["pending", "in_progress", "done"]).optional(),
  category: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, "タスク名を入力してください"),
  assignee: z.enum(["planner", "couple"]).optional(),
  note: z.string().optional(),
});

export type MilestoneInput = z.infer<typeof milestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type TaskInput = z.infer<typeof taskSchema>;

export const CATEGORIES = [
  { value: "会場", label: "会場" },
  { value: "衣装", label: "衣装" },
  { value: "招待状", label: "招待状" },
  { value: "料理", label: "料理" },
  { value: "装花", label: "装花" },
  { value: "写真", label: "写真" },
  { value: "音楽", label: "音楽" },
  { value: "引き出物", label: "引き出物" },
  { value: "その他", label: "その他" },
] as const;
