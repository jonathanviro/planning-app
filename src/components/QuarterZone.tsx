import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { AlertTriangle, X, Maximize2 } from "lucide-react";
import type { Initiative, Quarter } from "../types";

interface Props {
  id: Quarter;
  title: string;
  limit: number;
  used: number;
  initiatives: Initiative[];
  onRemove: (initiativeId: string) => void;
  onEdit: (initiative: Initiative) => void;
  onExpand: () => void;
}

export default function QuarterZone({
  id,
  title,
  limit,
  used,
  initiatives,
  onRemove,
  onEdit,
  onExpand,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isExceeded = used > limit;
  const progress = Math.min(100, (used / limit) * 100);

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex flex-col h-full bg-white rounded-3xl p-4 border-2 transition-all duration-300 overflow-hidden",
        isOver
          ? "border-brand-red bg-brand-red-soft/50 scale-[1.02] shadow-xl"
          : "border-transparent shadow-sm",
        isExceeded && "border-brand-red bg-red-50 ring-2 ring-brand-red/20",
      )}
    >
      {/* Header del Trimestre */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black text-brand-red-deep">{title}</h3>
            <button
              onClick={onExpand}
              className="p-1 text-neutral-grey hover:text-brand-red transition-colors rounded-lg hover:bg-brand-red-soft/20"
            >
              <Maximize2 size={16} />
            </button>
          </div>
          <p className="text-xs text-neutral-grey-deep font-medium uppercase tracking-wider">
            Trimestre
          </p>
        </div>
        <div className="text-right flex flex-col items-end">
          {isExceeded && (
            <AlertTriangle
              size={20}
              className="text-brand-red mb-1 animate-pulse"
            />
          )}
          <span
            className={clsx(
              "text-2xl font-bold",
              isExceeded ? "text-brand-red" : "text-neutral-grey-deep",
            )}
          >
            {used}
          </span>
          <span className="text-sm text-neutral-grey font-medium">
            {" "}
            / {limit}h
          </span>
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="h-2 w-full bg-neutral-grey-soft rounded-full mb-4 overflow-hidden">
        <div
          className={clsx(
            "h-full transition-all duration-500",
            isExceeded ? "bg-brand-red" : "bg-neutral-grey-deep",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Lista de Iniciativas Asignadas */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {initiatives.length === 0 && (
          <div className="h-full flex items-center justify-center text-neutral-grey text-sm italic">
            Arrastra aquí
          </div>
        )}
        {[...initiatives].reverse().map((init) => (
          <div
            key={init.id}
            onClick={() => onEdit(init)}
            className="group relative bg-white p-3 rounded-2xl shadow-sm border border-neutral-grey-soft hover:border-brand-red-soft transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-1">
              <span
                className={clsx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                  init.priority === "Must Have"
                    ? "bg-brand-red/10 text-brand-red"
                    : "bg-neutral-grey-soft text-neutral-grey-deep",
                )}
              >
                {init.priority}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(init.id);
                }}
                className="text-neutral-grey hover:text-brand-red transition-colors p-1 -mr-2 -mt-2"
              >
                <X size={16} />
              </button>
            </div>
            <h4 className="font-bold text-brand-red-deep text-sm leading-tight mb-1 line-clamp-2">
              {init.workName}
            </h4>
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-neutral-grey-deep truncate max-w-[70%]">
                {init.workType}
              </p>
              <span className="text-xs font-bold text-brand-red">
                {init.hours[id]}h
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
