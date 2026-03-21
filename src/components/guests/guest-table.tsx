"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { GuestForm } from "./guest-form";
import { deleteGuest } from "@/actions/guest-actions";
import { Trash2, ArrowUpDown } from "lucide-react";

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

type SortKey = "name" | "side";
type SortDir = "asc" | "desc";

type GuestTableProps = {
  guests: Guest[];
  weddingId: string;
};

function AttendanceBadge({ status }: { status: string }) {
  switch (status) {
    case "attending":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          出席
        </Badge>
      );
    case "declined":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          欠席
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          未回答
        </Badge>
      );
  }
}

function SideBadge({ side }: { side: string }) {
  return side === "bride" ? (
    <Badge variant="outline" className="border-pink-300 text-pink-700">
      新婦側
    </Badge>
  ) : (
    <Badge variant="outline" className="border-blue-300 text-blue-700">
      新郎側
    </Badge>
  );
}

export function GuestTable({ guests, weddingId }: GuestTableProps) {
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sortedGuests = useMemo(() => {
    const sorted = [...guests].sort((a, b) => {
      if (sortKey === "name") {
        const aKana = `${a.familyNameKana ?? a.familyName}${a.givenNameKana ?? a.givenName}`;
        const bKana = `${b.familyNameKana ?? b.familyName}${b.givenNameKana ?? b.givenName}`;
        return aKana.localeCompare(bKana, "ja");
      }
      if (sortKey === "side") {
        return a.side.localeCompare(b.side);
      }
      return 0;
    });
    return sortDir === "desc" ? sorted.reverse() : sorted;
  }, [guests, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleEdit(guest: Guest) {
    setEditingGuest(guest);
    setDialogOpen(true);
  }

  function handleDelete(e: React.MouseEvent, guestId: string) {
    e.stopPropagation();
    if (!confirm("このゲストを削除しますか？")) return;
    setDeletingId(guestId);
    startTransition(async () => {
      await deleteGuest(guestId);
      setDeletingId(null);
      router.refresh();
    });
  }

  if (guests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          ゲストがまだ登録されていません
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          「ゲストを追加」ボタンから登録を始めましょう
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => toggleSort("name")}
                >
                  名前
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">続柄</th>
              <th className="px-4 py-3 text-left font-medium">
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => toggleSort("side")}
                >
                  新郎/新婦側
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">出席状況</th>
              <th className="px-4 py-3 text-left font-medium">食事制限</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedGuests.map((guest) => (
              <tr
                key={guest.id}
                className="cursor-pointer border-b transition-colors hover:bg-muted/30 last:border-0"
                onClick={() => handleEdit(guest)}
              >
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium">
                      {guest.familyName} {guest.givenName}
                    </span>
                    {(guest.familyNameKana || guest.givenNameKana) && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {guest.familyNameKana} {guest.givenNameKana}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{guest.relationship}</td>
                <td className="px-4 py-3">
                  <SideBadge side={guest.side} />
                </td>
                <td className="px-4 py-3">
                  <AttendanceBadge status={guest.attendanceStatus} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {guest.dietaryRestrictions || guest.allergies
                    ? [guest.dietaryRestrictions, guest.allergies]
                        .filter(Boolean)
                        .join("、")
                    : "なし"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, guest.id)}
                    disabled={isPending && deletingId === guest.id}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">削除</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {sortedGuests.map((guest) => (
          <div
            key={guest.id}
            className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/30"
            onClick={() => handleEdit(guest)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">
                  {guest.familyName} {guest.givenName}
                </p>
                {(guest.familyNameKana || guest.givenNameKana) && (
                  <p className="text-xs text-muted-foreground">
                    {guest.familyNameKana} {guest.givenNameKana}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => handleDelete(e, guest.id)}
                disabled={isPending && deletingId === guest.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {guest.relationship}
              </span>
              <SideBadge side={guest.side} />
              <AttendanceBadge status={guest.attendanceStatus} />
            </div>
            {(guest.dietaryRestrictions || guest.allergies) && (
              <p className="mt-2 text-xs text-muted-foreground">
                食事制限:{" "}
                {[guest.dietaryRestrictions, guest.allergies]
                  .filter(Boolean)
                  .join("、")}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {editingGuest && (
          <GuestForm
            weddingId={weddingId}
            guest={editingGuest}
            onClose={() => {
              setDialogOpen(false);
              setEditingGuest(null);
            }}
          />
        )}
      </Dialog>
    </>
  );
}
