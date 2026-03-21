"use client";

import { useState, useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, X, MoreHorizontal, Trash2, Edit } from "lucide-react";
import {
  assignGuestToSeat,
  removeGuestFromSeat,
  deleteTable,
  updateTable,
} from "@/actions/seating-actions";
import type { SeatingTable } from "@/actions/seating-actions";

type UnassignedGuest = {
  id: string;
  familyName: string;
  givenName: string;
  side: string;
  relationship: string;
};

type TableComponentProps = {
  table: SeatingTable;
  unassignedGuests: UnassignedGuest[];
  onDataChange: () => void;
};

function DroppableSeat({
  tableId,
  seatIndex,
  children,
  isEmpty,
}: {
  tableId: string;
  seatIndex: number;
  children: React.ReactNode;
  isEmpty: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `seat-${tableId}-${seatIndex}`,
    data: { type: "seat", tableId, seatIndex },
    disabled: !isEmpty,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        isOver && isEmpty && "rounded-full ring-2 ring-primary ring-offset-1"
      )}
    >
      {children}
    </div>
  );
}

export function TableComponent({
  table,
  unassignedGuests,
  onDataChange,
}: TableComponentProps) {
  const [assigningSeatIndex, setAssigningSeatIndex] = useState<number | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(table.name);

  const isRound = table.shape === "round";
  const assignedCount = table.seatAssignments.length;
  const seats = Array.from({ length: table.capacity }, (_, index) => index);

  const getAssignment = useCallback(
    (seatIndex: number) =>
      table.seatAssignments.find((assignment) => assignment.seatIndex === seatIndex),
    [table.seatAssignments]
  );

  const handleAssignGuest = async (guestId: string, seatIndex: number) => {
    await assignGuestToSeat(guestId, table.id, seatIndex);
    setAssigningSeatIndex(null);
    setSearchQuery("");
    onDataChange();
  };

  const handleRemoveGuest = async (guestId: string) => {
    await removeGuestFromSeat(guestId);
    onDataChange();
  };

  const handleDeleteTable = async () => {
    if (!confirm("このテーブルを削除しますか？席の割り当ても解除されます。")) {
      return;
    }
    await deleteTable(table.id);
    onDataChange();
  };

  const handleSaveName = async () => {
    if (editName.trim() && editName !== table.name) {
      await updateTable(table.id, { name: editName.trim() });
      onDataChange();
    }
    setIsEditing(false);
  };

  const filteredGuests = unassignedGuests.filter((guest) => {
    if (!searchQuery) return true;
    const fullName = `${guest.familyName}${guest.givenName}`;
    return fullName.includes(searchQuery);
  });

  const abbreviateName = (familyName: string, givenName: string) => {
    return `${familyName} ${givenName.charAt(0)}.`;
  };

  const getSeatPosition = (index: number, total: number) => {
    if (isRound) {
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      const radius = 72;
      return {
        left: `${50 + Math.cos(angle) * radius}%`,
        top: `${50 + Math.sin(angle) * radius}%`,
      };
    }

    const longSide = Math.ceil(total / 2);
    if (index < longSide) {
      const spacing = 100 / (longSide + 1);
      return {
        left: `${spacing * (index + 1)}%`,
        top: "-14px",
      };
    }

    const bottomCount = total - longSide;
    const spacing = 100 / (bottomCount + 1);
    return {
      left: `${spacing * (index - longSide + 1)}%`,
      top: "calc(100% + 14px)",
    };
  };

  return (
    <div
      className="relative select-none"
      style={{
        width: isRound ? 180 : 220,
        height: isRound ? 180 : 130,
      }}
    >
      <div
        className="absolute inset-0"
        style={{ margin: isRound ? "-28px" : "-28px -10px" }}
      >
        {seats.map((seatIndex) => {
          const assignment = getAssignment(seatIndex);
          const position = getSeatPosition(seatIndex, table.capacity);
          const sideColor =
            assignment?.guest.side === "bride"
              ? "bg-pink-100 border-pink-300 text-pink-800"
              : assignment?.guest.side === "groom"
                ? "bg-blue-100 border-blue-300 text-blue-800"
                : "bg-gray-50 border-dashed border-gray-300";
          const isEmpty = !assignment;

          return (
            <div
              key={seatIndex}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: position.left, top: position.top }}
            >
              <DroppableSeat
                tableId={table.id}
                seatIndex={seatIndex}
                isEmpty={isEmpty}
              >
                {assignment ? (
                  <div
                    className={cn(
                      "group relative flex cursor-default items-center justify-center whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                      sideColor
                    )}
                    title={`${assignment.guest.familyName} ${assignment.guest.givenName} (${assignment.guest.relationship})`}
                  >
                    {abbreviateName(
                      assignment.guest.familyName,
                      assignment.guest.givenName
                    )}
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveGuest(assignment.guest.id);
                      }}
                      className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setAssigningSeatIndex(seatIndex);
                    }}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-500",
                      assigningSeatIndex === seatIndex &&
                        "border-primary bg-primary/5 text-primary"
                    )}
                    title={`席 ${seatIndex + 1}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </DroppableSeat>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-1 border-2 border-gray-300 bg-white shadow-sm",
          isRound ? "rounded-full" : "rounded-lg"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="absolute right-1 top-1 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              data-no-table-drag
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-3.5 w-3.5" />
              名前を編集
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDeleteTable}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isEditing ? (
          <Input
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSaveName();
              if (event.key === "Escape") {
                setEditName(table.name);
                setIsEditing(false);
              }
            }}
            className="h-6 w-16 px-1 text-center text-xs"
            autoFocus
            data-no-table-drag
          />
        ) : (
          <span className="text-sm font-semibold text-gray-700">
            {table.name}
          </span>
        )}

        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
          {assignedCount}/{table.capacity}
        </Badge>
      </div>

      {assigningSeatIndex !== null && (
        <div
          className="absolute z-50 w-48 rounded-lg border bg-white p-2 shadow-lg"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              席 {assigningSeatIndex + 1} にゲストを配置
            </span>
            <button
              onClick={() => {
                setAssigningSeatIndex(null);
                setSearchQuery("");
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <Input
            placeholder="ゲスト名で検索..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="mb-1.5 h-7 text-xs"
            autoFocus
          />
          <div className="max-h-32 space-y-0.5 overflow-y-auto">
            {filteredGuests.length === 0 ? (
              <p className="py-2 text-center text-xs text-gray-400">
                候補のゲストがいません
              </p>
            ) : (
              filteredGuests.map((guest) => (
                <button
                  key={guest.id}
                  onClick={() => handleAssignGuest(guest.id, assigningSeatIndex)}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs hover:bg-gray-100",
                    guest.side === "bride" ? "hover:bg-pink-50" : "hover:bg-blue-50"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                      guest.side === "bride" ? "bg-pink-400" : "bg-blue-400"
                    )}
                  />
                  <span className="truncate">
                    {guest.familyName} {guest.givenName}
                  </span>
                  <span className="flex-shrink-0 text-[10px] text-gray-400">
                    {guest.relationship}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
