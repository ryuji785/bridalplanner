"use client";

import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type Guest = {
  id: string;
  familyName: string;
  givenName: string;
  side: string;
  relationship: string;
};

type GuestSidebarProps = {
  unassignedGuests: Guest[];
};

function DraggableGuest({ guest }: { guest: Guest }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `guest-${guest.id}`,
      data: { type: "guest", guest },
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
      }}
      {...listeners}
      {...attributes}
      className={cn(
        "flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-50 active:cursor-grabbing",
        isDragging && "bg-white shadow-lg ring-2 ring-primary/20"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          guest.side === "bride" ? "bg-pink-400" : "bg-blue-400"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          {guest.familyName} {guest.givenName}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {guest.relationship}
        </p>
      </div>
    </div>
  );
}

export function GuestSidebar({ unassignedGuests }: GuestSidebarProps) {
  const [search, setSearch] = useState("");

  const filteredGuests = useMemo(() => {
    if (!search) return unassignedGuests;

    return unassignedGuests.filter((guest) => {
      const fullName = `${guest.familyName}${guest.givenName}`;
      return fullName.includes(search);
    });
  }, [search, unassignedGuests]);

  const brideGuests = filteredGuests.filter((guest) => guest.side === "bride");
  const groomGuests = filteredGuests.filter((guest) => guest.side === "groom");

  return (
    <div className="flex h-full w-72 flex-col border-l bg-white">
      <div className="border-b p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <User className="h-4 w-4" />
            未割当ゲスト
          </h3>
          <Badge variant="secondary" className="text-xs">
            {unassignedGuests.length}名
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ゲスト名で検索..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredGuests.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {search
              ? "検索条件に一致するゲストがいません"
              : "すべてのゲストが割当済みです"}
          </div>
        ) : (
          <>
            {groomGuests.length > 0 ? (
              <div className="mb-3">
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <span className="text-xs font-medium text-muted-foreground">
                    新郎側
                  </span>
                  <Badge variant="outline" className="h-4 px-1 text-[10px]">
                    {groomGuests.length}
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  {groomGuests.map((guest) => (
                    <DraggableGuest key={guest.id} guest={guest} />
                  ))}
                </div>
              </div>
            ) : null}

            {groomGuests.length > 0 && brideGuests.length > 0 ? (
              <Separator className="my-2" />
            ) : null}

            {brideGuests.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="h-2 w-2 rounded-full bg-pink-400" />
                  <span className="text-xs font-medium text-muted-foreground">
                    新婦側
                  </span>
                  <Badge variant="outline" className="h-4 px-1 text-[10px]">
                    {brideGuests.length}
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  {brideGuests.map((guest) => (
                    <DraggableGuest key={guest.id} guest={guest} />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="border-t p-2">
        <p className="text-center text-[10px] text-muted-foreground">
          ゲストをドラッグして空席に割り当てます
        </p>
      </div>
    </div>
  );
}
