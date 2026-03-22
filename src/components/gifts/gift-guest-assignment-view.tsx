"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  assignGiftToGuest,
  removeGiftAssignment,
} from "@/actions/gift-actions";
import { formatYen } from "@/lib/utils";

type Gift = {
  id: string;
  name: string;
  category: string | null;
  unitPrice: number;
};

type GuestAssignment = {
  id: string;
  quantity: number;
  gift: {
    id: string;
    name: string;
    unitPrice: number;
    category: string | null;
  };
};

type GuestTarget = {
  id: string;
  familyName: string;
  givenName: string;
  relationship: string;
  side: string;
  attendanceStatus: string;
  assignments: GuestAssignment[];
};

type Props = {
  guests: GuestTarget[];
  gifts: Gift[];
};

function AttendanceBadge({ status }: { status: string }) {
  if (status === "attending") {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        出席
      </Badge>
    );
  }

  if (status === "declined") {
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        欠席
      </Badge>
    );
  }

  return (
    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
      未確認
    </Badge>
  );
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

export function GiftGuestAssignmentView({ guests, gifts }: Props) {
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");
  const [selectedGiftId, setSelectedGiftId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function openDialog(guestId: string) {
    setSelectedGuestId(guestId);
    setSelectedGiftId(gifts[0]?.id ?? "");
    setQuantity(1);
    setDialogOpen(true);
  }

  function handleAssign() {
    if (!selectedGuestId || !selectedGiftId) return;

    startTransition(async () => {
      await assignGiftToGuest(selectedGiftId, selectedGuestId, quantity);
      setDialogOpen(false);
      setSelectedGiftId("");
      setQuantity(1);
    });
  }

  function handleRemove(assignmentId: string) {
    if (!confirm("この割当を削除しますか？")) return;
    startTransition(async () => {
      await removeGiftAssignment(assignmentId);
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">ゲスト</th>
              <th className="p-3 text-left text-sm font-medium">属性</th>
              <th className="p-3 text-left text-sm font-medium">割当内容</th>
              <th className="p-3 text-right text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.id} className="border-b align-top last:border-b-0">
                <td className="p-3">
                  <div>
                    <p className="font-medium">
                      {guest.familyName} {guest.givenName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {guest.relationship}
                    </p>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <SideBadge side={guest.side} />
                    <AttendanceBadge status={guest.attendanceStatus} />
                  </div>
                </td>
                <td className="p-3">
                  {guest.assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">未割当</p>
                  ) : (
                    <div className="space-y-2">
                      {guest.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <Badge variant="outline">
                            {assignment.gift.name} x{assignment.quantity}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatYen(
                              assignment.gift.unitPrice * assignment.quantity
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-destructive hover:text-destructive"
                            onClick={() => handleRemove(assignment.id)}
                            disabled={isPending}
                          >
                            削除
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDialog(guest.id)}
                    disabled={gifts.length === 0}
                  >
                    追加
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>ゲストにギフトを割り当て</DialogTitle>
          </DialogHeader>
          {gifts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              先にギフトを登録してください。
            </p>
          ) : (
            <div className="space-y-4">
              <Select value={selectedGiftId} onValueChange={setSelectedGiftId}>
                <SelectTrigger>
                  <SelectValue placeholder="ギフトを選択" />
                </SelectTrigger>
                <SelectContent>
                  {gifts.map((gift) => (
                    <SelectItem key={gift.id} value={gift.id}>
                      {gift.name} ({formatYen(gift.unitPrice)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) =>
                  setQuantity(Math.max(1, Number(event.target.value) || 1))
                }
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={isPending || !selectedGiftId}
                >
                  {isPending ? "保存中..." : "割り当てる"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
