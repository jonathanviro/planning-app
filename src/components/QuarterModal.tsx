import clsx from "clsx";
import { X } from "lucide-react";
import type { Initiative, Quarter } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quarterId: Quarter | null;
  title: string;
  initiatives: Initiative[];
  onRemove: (id: string) => void;
  onEdit: (init: Initiative) => void;
  limit: number;
  used: number;
}

export default function QuarterModal({
  isOpen,
  onClose,
  quarterId,
  title,
  initiatives,
  onRemove,
  onEdit,
  limit,
  used,
}: Props) {
  if (!isOpen || !quarterId) return null;

  const remaining = limit - used;
  const isExceeded = used > limit;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-neutral-grey-soft flex justify-between items-center bg-neutral-grey-soft/30">
          <div>
            <div className="flex items-baseline gap-3">
              <h3 className="text-3xl font-black text-brand-red-deep">
                {title}
              </h3>
              <div className="flex items-baseline gap-1">
                <span
                  className={clsx(
                    "text-2xl font-bold",
                    isExceeded ? "text-brand-red" : "text-neutral-grey-deep",
                  )}
                >
                  {used}
                </span>
                <span className="text-lg text-neutral-grey-deep font-medium">
                  / {limit} h
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-neutral-grey-deep font-medium">
                {initiatives.length} actividades
              </p>
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-grey" />
              <p
                className={clsx(
                  "font-bold",
                  isExceeded ? "text-brand-red" : "text-green-600",
                )}
              >
                {remaining >= 0
                  ? `${remaining}h disponibles`
                  : `${Math.abs(remaining)}h excedidas`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-grey-soft rounded-full transition-colors text-neutral-grey-deep hover:text-brand-red"
          >
            <X size={32} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-grey-soft/20">
          <div className="grid grid-cols-3 gap-4">
            {[...initiatives].reverse().map((init) => (
              <div
                key={init.id}
                onClick={() => onEdit(init)}
                className="group relative bg-white p-4 rounded-2xl shadow-sm border border-neutral-grey-soft hover:border-brand-red-soft transition-all cursor-pointer hover:shadow-md flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={clsx(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
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
                    <X size={20} />
                  </button>
                </div>
                <h4 className="font-bold text-brand-red-deep text-base leading-tight mb-3 line-clamp-2">
                  {init.workName}
                </h4>
                <div className="flex justify-between items-center mt-auto pt-2 border-t border-neutral-grey-soft/50">
                  <p className="text-xs text-neutral-grey-deep truncate max-w-[70%]">
                    {init.workType}
                  </p>
                  <span className="text-sm font-bold text-brand-red">
                    {init.hours[quarterId]}h
                  </span>
                </div>
              </div>
            ))}
          </div>

          {initiatives.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-neutral-grey">
              <p className="text-xl font-medium">
                No hay actividades en este trimestre
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
