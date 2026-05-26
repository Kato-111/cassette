"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useId, useState } from "react";
import { QueueListRow } from "@/app/_playback/queue-list-row";
import {
  useRemoveFromUserQueue,
  useReorderUserQueue,
  useUserQueue,
} from "@/contexts/deck-context";
import { cn } from "@/lib/utils";

type QueueListProps = {
  className?: string;
  listClassName?: string;
};

export const QueueList = ({ className, listClassName }: QueueListProps) => {
  const dndContextId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const userQueue = useUserQueue();
  const removeFromUserQueue = useRemoveFromUserQueue();
  const reorderUserQueue = useReorderUserQueue();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const activeItem =
    activeId != null ? userQueue.find((item) => item.id === activeId) : undefined;

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderUserQueue(String(active.id), String(over.id));
  };

  const onDragCancel = () => {
    setActiveId(null);
  };

  return (
    <section className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Queue</h3>
        {userQueue.length > 0 ? (
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
            {userQueue.length === 1
              ? "1 queued"
              : `${userQueue.length} queued`}
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "-mx-2 min-h-0 flex-1 overflow-y-auto",
          listClassName,
        )}
      >
        {userQueue.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            Nothing queued — add tracks from your library
          </p>
        ) : (
          <DndContext
            id={dndContextId}
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
          >
            <SortableContext
              items={userQueue.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col">
                {userQueue.map((item) => (
                  <QueueListRow
                    key={item.id}
                    item={item}
                    onRemove={removeFromUserQueue}
                  />
                ))}
              </ul>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeItem ? (
                <QueueListRow
                  item={activeItem}
                  onRemove={removeFromUserQueue}
                  overlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </section>
  );
};
