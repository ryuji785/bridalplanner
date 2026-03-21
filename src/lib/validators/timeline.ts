import { z } from "zod";

const timePattern = /^\d{2}:\d{2}$/;

export const timelineEntryCreateSchema = z.object({
  startTime: z
    .string()
    .min(1, "開始時刻を入力してください")
    .regex(timePattern, "時刻は HH:MM 形式で入力してください"),
  endTime: z
    .string()
    .regex(timePattern, "時刻は HH:MM 形式で入力してください")
    .optional()
    .or(z.literal("")),
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  category: z
    .enum(["preparation", "ceremony", "reception"])
    .optional()
    .or(z.literal("")),
  sortOrder: z.number().int().default(0),
});

export const timelineEntryUpdateSchema = timelineEntryCreateSchema.partial();

export type TimelineEntryCreateInput = z.infer<typeof timelineEntryCreateSchema>;
export type TimelineEntryUpdateInput = z.infer<typeof timelineEntryUpdateSchema>;
