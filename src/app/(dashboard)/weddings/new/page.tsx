"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWedding } from "@/actions/wedding-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewWeddingPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setErrors({});

    try {
      const result = await createWedding(formData);

      if (!result.success) {
        setErrors(result.errors ?? {});
        return;
      }

      router.push(`/weddings/${result.weddingId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>新規結婚式を作成</CardTitle>
          <CardDescription>
            結婚式の基本情報を入力してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">結婚式タイトル</Label>
              <Input
                id="title"
                name="title"
                placeholder="例: 山田・佐藤 結婚式"
                required
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weddingDate">挙式日</Label>
              <Input
                id="weddingDate"
                name="weddingDate"
                type="date"
                required
              />
              {errors.weddingDate && (
                <p className="text-sm text-destructive">
                  {errors.weddingDate[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">会場</Label>
              <Input
                id="venue"
                name="venue"
                placeholder="例: ホテルニューオータニ"
              />
              {errors.venue && (
                <p className="text-sm text-destructive">{errors.venue[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">予算（円）</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                placeholder="例: 3000000"
                min={0}
              />
              {errors.budget && (
                <p className="text-sm text-destructive">{errors.budget[0]}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "作成中..." : "作成する"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
