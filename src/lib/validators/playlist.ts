import { z } from "zod";

export const sectionCreateSchema = z.object({
  name: z.string().min(1, "セクション名を入力してください"),
  sortOrder: z.number().int().default(0),
});

export const sectionUpdateSchema = sectionCreateSchema.partial();

export const songCreateSchema = z.object({
  title: z.string().min(1, "曲名を入力してください"),
  artist: z.string().min(1, "アーティスト名を入力してください"),
  durationSec: z
    .number({ invalid_type_error: "再生時間を正しく入力してください" })
    .int()
    .min(0)
    .optional(),
  note: z.string().optional().or(z.literal("")),
  sortOrder: z.number().int().default(0),
});

export const songUpdateSchema = songCreateSchema.partial();

export type SectionCreateInput = z.infer<typeof sectionCreateSchema>;
export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;
export type SongCreateInput = z.infer<typeof songCreateSchema>;
export type SongUpdateInput = z.infer<typeof songUpdateSchema>;
