"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import {
  assignGuestToSeat,
  getSeatingData,
  updateTablePosition,
} from "@/actions/seating-actions";
import type { SeatingData } from "@/actions/seating-actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GuestSidebar } from "./guest-sidebar";
import { SeatingToolbar } from "./seating-toolbar";
import { TableComponent } from "./table-component";

type FloorPlanCanvasProps = {
  initialData: SeatingData;
  weddingId: string;
};

export function FloorPlanCanvas({
  initialData,
  weddingId,
}: FloorPlanCanvasProps) {
  const [data, setData] = useState<SeatingData>(initialData);
  const [zoom, setZoom] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragTableStart, setDragTableStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [activeDragGuest, setActiveDragGuest] = useState<{
    id: string;
    familyName: string;
    givenName: string;
    side: string;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const refreshData = useCallback(async () => {
    const nextData = await getSeatingData(weddingId);
    setData(nextData);
  }, [weddingId]);

  function handleZoomIn() {
    setZoom((current) => Math.min(200, current + 10));
  }

  function handleZoomOut() {
    setZoom((current) => Math.max(30, current - 10));
  }

  function handleZoomReset() {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  }

  function handleCanvasMouseDown(event: React.MouseEvent) {
    if (event.button === 1 || (event.button === 0 && event.altKey)) {
      event.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: event.clientX - panOffset.x,
        y: event.clientY - panOffset.y,
      });
    }
  }

  function handleCanvasMouseMove(event: React.MouseEvent) {
    if (isPanning) {
      setPanOffset({
        x: event.clientX - panStart.x,
        y: event.clientY - panStart.y,
      });
    }
  }

  function handleCanvasMouseUp() {
    setIsPanning(false);
  }

  function handleTableMouseDown(tableId: string, event: React.MouseEvent) {
    if (event.button !== 0 || event.altKey) return;

    const target = event.target as HTMLElement;
    if (target.closest("button,input,[data-no-table-drag]")) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    setDraggingTableId(tableId);

    const table = data.tables.find((candidate) => candidate.id === tableId);
    if (table) {
      setDragTableStart({
        x: event.clientX - table.posX * (zoom / 100),
        y: event.clientY - table.posY * (zoom / 100),
      });
    }
  }

  useEffect(() => {
    if (!draggingTableId || !dragTableStart) return;

    const handleMouseMove = (event: MouseEvent) => {
      const nextX = (event.clientX - dragTableStart.x) / (zoom / 100);
      const nextY = (event.clientY - dragTableStart.y) / (zoom / 100);

      setData((current) => ({
        ...current,
        tables: current.tables.map((table) =>
          table.id === draggingTableId
            ? { ...table, posX: Math.max(0, nextX), posY: Math.max(0, nextY) }
            : table
        ),
      }));
    };

    const handleMouseUp = async () => {
      const table = data.tables.find((candidate) => candidate.id === draggingTableId);
      if (table) {
        await updateTablePosition(draggingTableId, table.posX, table.posY);
      }
      setDraggingTableId(null);
      setDragTableStart(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [data.tables, dragTableStart, draggingTableId, zoom]);

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "guest") {
      setActiveDragGuest(event.active.data.current.guest);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragGuest(null);

    const { active, over } = event;
    if (!over || !active.data.current?.type) return;

    if (active.data.current.type === "guest" && over.data.current?.type === "seat") {
      const guestId = active.data.current.guest.id;
      const { tableId, seatIndex } = over.data.current;
      await assignGuestToSeat(guestId, tableId, seatIndex);
      await refreshData();
    }
  }

  function handleWheel(event: React.WheelEvent) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -5 : 5;
      setZoom((current) => Math.max(30, Math.min(200, current + delta)));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col">
        <SeatingToolbar
          weddingId={weddingId}
          data={data}
          onDataChange={refreshData}
        />

        <div className="flex flex-1 overflow-hidden">
          <div
            ref={canvasRef}
            className={cn(
              "relative flex-1 overflow-hidden",
              isPanning ? "cursor-grabbing" : "cursor-default"
            )}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
            style={{
              background: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
              backgroundSize: `${20 * (zoom / 100)}px ${20 * (zoom / 100)}px`,
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
            }}
          >
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-lg border bg-white p-1 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="w-10 text-center text-xs font-medium">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomReset}
              >
                <Maximize className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div
              className="relative h-full w-full"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`,
                transformOrigin: "0 0",
              }}
            >
              {data.tables.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p className="mb-1 text-lg font-medium">
                      テーブルがまだありません
                    </p>
                    <p className="text-sm">
                      「テーブル追加」から会場レイアウトを作成してください。
                    </p>
                  </div>
                </div>
              ) : (
                data.tables.map((table) => (
                  <div
                    key={table.id}
                    className={cn(
                      "absolute",
                      draggingTableId === table.id
                        ? "z-20 cursor-grabbing"
                        : "z-10 cursor-grab"
                    )}
                    style={{ left: table.posX, top: table.posY }}
                    onMouseDown={(event) => handleTableMouseDown(table.id, event)}
                  >
                    <TableComponent
                      table={table}
                      unassignedGuests={data.unassignedGuests}
                      onDataChange={refreshData}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <GuestSidebar unassignedGuests={data.unassignedGuests} />
        </div>
      </div>

      <DragOverlay>
        {activeDragGuest ? (
          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-lg">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                activeDragGuest.side === "bride" ? "bg-pink-400" : "bg-blue-400"
              )}
            />
            {activeDragGuest.familyName} {activeDragGuest.givenName}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
