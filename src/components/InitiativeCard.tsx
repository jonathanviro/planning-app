import { useDraggable } from "@dnd-kit/core";
import clsx from "clsx";
import { forwardRef } from "react";
import type { Initiative } from "../types";

interface Props {
  initiative: Initiative;
  isAssigned?: boolean;
  isOverlay?: boolean;
}

// Componente visual puro
export const InitiativeCardView = forwardRef<
  HTMLDivElement,
  Props & { style?: React.CSSProperties } & React.HTMLAttributes<HTMLDivElement>
>(({ initiative, isAssigned, isOverlay, style, ...props }, ref) => {
  return (
    <div
      ref={ref}
      style={style}
      {...props}
      className={clsx(
        "bg-white p-4 rounded-2xl shadow-sm border-2 transition-all touch-none select-none",
        isOverlay
          ? "z-50 shadow-2xl scale-105 border-brand-red rotate-2 opacity-90 cursor-grabbing"
          : "border-transparent hover:border-neutral-grey",
        isAssigned && !isOverlay
          ? "opacity-50 grayscale cursor-not-allowed"
          : "cursor-grab active:cursor-grabbing hover:shadow-md",
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={clsx(
            "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
            initiative.priority === "Must Have"
              ? "bg-brand-red/10 text-brand-red"
              : "bg-neutral-grey-soft text-neutral-grey-deep",
          )}
        >
          {initiative.priority}
        </span>
      </div>
      <h4 className="font-bold text-brand-red-deep leading-tight mb-1">
        {initiative.workName}
      </h4>
      <p className="text-xs text-neutral-grey-deep">{initiative.workType}</p>
    </div>
  );
});

// Componente con lógica de arrastre
export default function InitiativeCard({ initiative, isAssigned }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: initiative.id,
    data: initiative,
    disabled: isAssigned,
  });

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        className="opacity-30 bg-neutral-grey-soft/50 rounded-2xl border-2 border-dashed border-neutral-grey h-[120px]"
      />
    );
  }

  return (
    <InitiativeCardView
      ref={setNodeRef}
      initiative={initiative}
      isAssigned={isAssigned}
      {...listeners}
      {...attributes}
    />
  );
}
