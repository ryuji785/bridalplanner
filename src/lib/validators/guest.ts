import { z } from "zod";

export const guestCreateSchema = z.object({
  familyName: z.string().min(1, "姓を入力してください"),
  givenName: z.string().min(1, "名を入力してください"),
  familyNameKana: z.string().optional(),
  givenNameKana: z.string().optional(),
  relationship: z.string().min(1, "関係を入力してください"),
  side: z.enum(["bride", "groom"], {
    required_error: "新郎側・新婦側を選択してください",
  }),
  attendanceStatus: z
    .enum(["pending", "attending", "declined"])
    .default("pending"),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  email: z
    .string()
    .email("正しいメールアドレスを入力してください")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  allergies: z.string().optional(),
  note: z.string().optional(),
  plusOne: z.boolean().default(false),
  isChild: z.boolean().default(false),
});

export const guestUpdateSchema = guestCreateSchema.partial();

export type GuestCreateInput = z.infer<typeof guestCreateSchema>;
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>;
