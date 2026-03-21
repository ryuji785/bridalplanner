"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createGiftGroup,
  deleteGiftGroup,
  assignGiftToGroup,
  removeGiftAssignment,
} from "@/actions/gift-actions";
import { formatYen } from "@/lib/utils";

type Gift = {
  id: string;
  name: string;
  category: string | null;
  unitPrice: number;
};

type GiftAssignment = {
  id: string;
  quantity: number;
  gift: {
    id: string;
    name: string;
    unitPrice: number;
    category: string | null;
  };
};

type GiftGroup = {
  id: string;
  name: string;
  assignments: GiftAssignment[];
};

type Props = {
  groups: GiftGroup[];
  gifts: Gift[];
  weddingId: string;
};

export function GiftGroupAssignmentView({
  groups,
  gifts,
  weddingId,
}: Props) {
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [assignFormOpen, setAssignFormOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedGiftId, setSelectedGiftId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const groupFormRef = useRef<HTMLFormElement>(null);

  function handleCreateGroup(formData: FormData) {
    startTransition(async () => {
      const result = await createGiftGroup(weddingId, formData);
      if (result.success) {
        setGroupFormOpen(false);
        groupFormRef.current?.reset();
      }
    });
  }

  function handleDeleteGroup(groupId: string) {
    if (!confirm("このグループを削除しますか？割り当ても解除されます。")) return;
    startTransition(async () => {
      await deleteGiftGroup(groupId);
    });
  }

  function handleAssignGift() {
    if (!selectedGroupId || !selectedGiftId) return;

    startTransition(async () => {
      await assignGiftToGroup(selectedGiftId, selectedGroupId, quantity);
      setAssignFormOpen(false);
      setSelectedGiftId("");
      setQuantity(1);
    });
  }

  function handleRemoveAssignment(assignmentId: string) {
    if (!confirm("この割り当てを削除しますか？")) return;
    startTransition(async () => {
      await removeGiftAssignment(assignmentId);
    });
  }

  function openAssignForm(groupId: string) {
    setSelectedGroupId(groupId);
    setSelectedGiftId(gifts[0]?.id ?? "");
    setQuantity(1);
    setAssignFormOpen(true);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setGroupFormOpen(true)}>グループを追加</Button>
      </div>

      {groups.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="mb-2 text-lg">グループがまだありません</p>
          <p className="text-sm">
            グループを作成して、まとめて引き出物を割り当ててください。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const totalCost = group.assignments.reduce(
              (sum, assignment) =>
                sum + assignment.gift.unitPrice * assignment.quantity,
              0
            );

            return (
              <Card key={group.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        割当 {group.assignments.length}件
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{formatYen(totalCost)}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignForm(group.id)}
                        disabled={gifts.length === 0}
                      >
                        ギフトを追加
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGroup(group.id)}
                        disabled={isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      まだギフトは割り当てられていません。
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {group.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between border-b py-2 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {assignment.gift.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              ×{assignment.quantity}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {formatYen(
                                assignment.gift.unitPrice * assignment.quantity
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveAssignment(assignment.id)
                              }
                              disabled={isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              削除
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={groupFormOpen} onOpenChange={setGroupFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>グループを追加</DialogTitle>
          </DialogHeader>
          <form ref={groupFormRef} action={handleCreateGroup} className="space-y-4">
            <Input
              name="name"
              placeholder="例: 親族 / 主賓 / 会社関係"
              required
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setGroupFormOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "追加中..." : "追加"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignFormOpen} onOpenChange={setAssignFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>グループにギフトを割り当て</DialogTitle>
          </DialogHeader>
          {gifts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              先にギフトを登録してください。
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
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
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Math.max(1, Number(event.target.value) || 1))
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssignFormOpen(false)}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleAssignGift}
                  disabled={isPending || !selectedGiftId}
                >
                  {isPending ? "保存中..." : "割り当て"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
