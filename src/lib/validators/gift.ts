import { z } from "zod";

export const giftCreateSchema = z.object({
  name: z.string().min(1, "ギフト名を入力してください"),
  category: z
    .enum(["main", "sweets", "petite"])
    .optional()
    .or(z.literal("")),
  unitPrice: z
    .number({ invalid_type_error: "単価を入力してください" })
    .int("単価は整数で入力してください")
    .min(0, "単価は0円以上で入力してください"),
  supplier: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export const giftUpdateSchema = giftCreateSchema.partial();

export const giftGroupCreateSchema = z.object({
  name: z.string().min(1, "グループ名を入力してください"),
});

export const giftAssignmentSchema = z
  .object({
    giftId: z.string().min(1),
    guestId: z.string().optional(),
    groupId: z.string().optional(),
    quantity: z
      .number()
      .int()
      .min(1, "数量は1以上で入力してください")
      .default(1),
  })
  .refine(
    (data) => (Boolean(data.guestId) ? 1 : 0) + (Boolean(data.groupId) ? 1 : 0) === 1,
    {
      message: "割り当て先を選択してください",
      path: ["giftId"],
    }
  );

export type GiftCreateInput = z.infer<typeof giftCreateSchema>;
export type GiftUpdateInput = z.infer<typeof giftUpdateSchema>;
export type GiftGroupCreateInput = z.infer<typeof giftGroupCreateSchema>;
export type GiftAssignmentInput = z.infer<typeof giftAssignmentSchema>;
