"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { importGuestsFromCsv, type GuestCsvImportResult } from "@/actions/guest-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GuestCsvDialogProps = {
  weddingId: string;
};

export function GuestCsvDialog({ weddingId }: GuestCsvDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<GuestCsvImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setFile(null);
      setResult(null);
    }
  }

  function handleImport() {
    if (!file) return;

    startTransition(async () => {
      const csvText = await file.text();
      const nextResult = await importGuestsFromCsv(weddingId, csvText);
      setResult(nextResult);

      if (nextResult.success) {
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        CSV取り込み
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>ゲストCSVの取り込み</DialogTitle>
            <DialogDescription>
              エクスポートしたCSVを編集して取り込めます。1件でもエラーがある場合は全件中止します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) =>
                  setFile(event.target.files?.[0] ?? null)
                }
              />
              <p className="text-xs text-muted-foreground">
                `id` が入っている行は更新、空欄の行は新規追加されます。
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">対応する値</p>
              <p className="mt-1 text-muted-foreground">
                新郎新婦側: `bride` / `groom` または `新婦側` / `新郎側`
              </p>
              <p className="text-muted-foreground">
                出欠: `pending` / `attending` / `declined` または `未確認` / `出席` / `欠席`
              </p>
              <p className="text-muted-foreground">
                同伴者あり・お子様: `true` / `false`、`1` / `0`、`はい` / `いいえ`
              </p>
            </div>

            {result ? (
              <div
                className={
                  result.success
                    ? "rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                    : "rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                }
              >
                {result.success ? (
                  <>
                    <p className="font-medium">CSVの取り込みが完了しました。</p>
                    <p className="mt-1">
                      新規追加 {result.created} 件 / 更新 {result.updated} 件 / 合計 {result.total} 件
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">CSVの取り込みに失敗しました。</p>
                    <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
                      {result.errors.map((error) => (
                        <p key={error}>{error}</p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              閉じる
            </Button>
            <Button onClick={handleImport} disabled={!file || isPending}>
              {isPending ? "取り込み中..." : "取り込みを開始"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
