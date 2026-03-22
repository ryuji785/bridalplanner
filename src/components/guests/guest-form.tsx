"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { createGuest, updateGuest } from "@/actions/guest-actions";

const RELATIONSHIP_OPTIONS = [
  "友人",
  "親族",
  "兄弟姉妹",
  "会社関係",
  "上司",
  "同僚",
  "恩師",
  "主賓",
  "受付",
  "その他",
] as const;

type Guest = {
  id: string;
  familyName: string;
  givenName: string;
  familyNameKana: string | null;
  givenNameKana: string | null;
  relationship: string;
  side: string;
  attendanceStatus: string;
  postalCode: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  dietaryRestrictions: string | null;
  allergies: string | null;
  note: string | null;
  plusOne: boolean;
  isChild: boolean;
};

type GuestFormProps = {
  weddingId: string;
  guest?: Guest;
  onClose: () => void;
};

export function GuestForm({ weddingId, guest, onClose }: GuestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(guest);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateGuest(guest!.id, formData)
        : await createGuest(weddingId, formData);

      if (result.success) {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "ゲスト情報を編集" : "ゲストを追加"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "ゲスト情報を更新します。"
            : "新しいゲストの情報を入力してください。"}
        </DialogDescription>
      </DialogHeader>

      <form action={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            基本情報
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="familyName">
                姓 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="familyName"
                name="familyName"
                defaultValue={guest?.familyName ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="givenName">
                名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="givenName"
                name="givenName"
                defaultValue={guest?.givenName ?? ""}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="familyNameKana">姓カナ</Label>
              <Input
                id="familyNameKana"
                name="familyNameKana"
                defaultValue={guest?.familyNameKana ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="givenNameKana">名カナ</Label>
              <Input
                id="givenNameKana"
                name="givenNameKana"
                defaultValue={guest?.givenNameKana ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="relationship">
                関係 <span className="text-destructive">*</span>
              </Label>
              <Select name="relationship" defaultValue={guest?.relationship ?? ""}>
                <SelectTrigger id="relationship">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                新郎側・新婦側 <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="side"
                    value="groom"
                    defaultChecked={guest?.side === "groom"}
                    className="h-4 w-4 accent-primary"
                    required
                  />
                  新郎側
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="side"
                    value="bride"
                    defaultChecked={guest?.side === "bride"}
                    className="h-4 w-4 accent-primary"
                  />
                  新婦側
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendanceStatus">出欠</Label>
            <Select
              name="attendanceStatus"
              defaultValue={guest?.attendanceStatus ?? "pending"}
            >
              <SelectTrigger id="attendanceStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">未確認</SelectItem>
                <SelectItem value="attending">出席</SelectItem>
                <SelectItem value="declined">欠席</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            連絡先
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">郵便番号</Label>
              <Input
                id="postalCode"
                name="postalCode"
                defaultValue={guest?.postalCode ?? ""}
                placeholder="123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={guest?.phone ?? ""}
                placeholder="090-1234-5678"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">住所</Label>
            <Input
              id="address"
              name="address"
              defaultValue={guest?.address ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={guest?.email ?? ""}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            食事・補足
          </h4>
          <div className="space-y-2">
            <Label htmlFor="dietaryRestrictions">食事制限</Label>
            <Input
              id="dietaryRestrictions"
              name="dietaryRestrictions"
              defaultValue={guest?.dietaryRestrictions ?? ""}
              placeholder="ベジタリアン、ハラール など"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergies">アレルギー</Label>
            <Input
              id="allergies"
              name="allergies"
              defaultValue={guest?.allergies ?? ""}
              placeholder="えび、かに、卵 など"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">メモ</Label>
            <Textarea
              id="note"
              name="note"
              defaultValue={guest?.note ?? ""}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="plusOne"
                name="plusOne"
                defaultChecked={guest?.plusOne ?? false}
              />
              <Label htmlFor="plusOne" className="cursor-pointer">
                同伴者あり
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isChild"
                name="isChild"
                defaultChecked={guest?.isChild ?? false}
              />
              <Label htmlFor="isChild" className="cursor-pointer">
                お子様
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "保存中..."
              : isEditing
                ? "更新する"
                : "追加する"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
