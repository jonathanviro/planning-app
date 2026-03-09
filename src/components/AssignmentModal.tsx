import { useState, useEffect } from "react";
import clsx from "clsx";
import { Plus, ChevronUp } from "lucide-react";
import type { Initiative, Quarter } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hours: Record<Quarter, number>, quarters: Quarter[]) => void;
  initiative: Initiative | null;
  targetQuarter: Quarter | null;
}

const QUICK_ADD_VALUES = [1, 5, 10, 20, 40];

export default function AssignmentModal({
  isOpen,
  onClose,
  onSave,
  initiative,
  targetQuarter,
}: Props) {
  const [hours, setHours] = useState<Record<Quarter, number>>({
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
  });
  const [selectedQuarters, setSelectedQuarters] = useState<Quarter[]>([]);
  const [showAllQuarters, setShowAllQuarters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initiative && targetQuarter) {
      // Si ya tiene horas asignadas, las usamos. Si no, empiezan en 0.
      setHours(initiative.hours);
      setSelectedQuarters([targetQuarter]);
      setShowAllQuarters(false);
      setError(null);
    }
  }, [isOpen, initiative, targetQuarter]);

  if (!isOpen || !initiative || !targetQuarter) return null;

  const handleSave = () => {
    // Validar que no haya trimestres seleccionados con 0 horas
    const invalidQuarters = selectedQuarters.filter(
      (q) => (hours[q] || 0) <= 0,
    );

    if (invalidQuarters.length > 0) {
      setError("No puedes asignar 0 horas a una actividad");
      return;
    }

    onSave(hours, selectedQuarters);
    onClose();
  };

  const toggleQuarter = (q: Quarter) => {
    if (selectedQuarters.includes(q)) {
      setSelectedQuarters(selectedQuarters.filter((item) => item !== q));
    } else {
      setSelectedQuarters([...selectedQuarters, q]);
    }
  };

  const addHours = (q: Quarter, amount: number) => {
    setError(null);
    setHours((prev) => ({
      ...prev,
      [q]: Math.max(0, (prev[q] || 0) + amount),
    }));
  };

  const renderQuarterInput = (q: Quarter) => {
    const isSelected = selectedQuarters.includes(q);
    const isTarget = q === targetQuarter;

    if (!isSelected && !showAllQuarters) return null;

    return (
      <div
        key={q}
        className={clsx(
          "p-4 rounded-2xl border-2 transition-all",
          isSelected
            ? "border-brand-red bg-brand-red-soft/20"
            : "border-neutral-grey-soft bg-white opacity-60",
        )}
      >
        <div className="flex justify-between items-center mb-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleQuarter(q)}
              disabled={isTarget}
              className="w-5 h-5 text-brand-red rounded focus:ring-brand-red"
            />
            <span className="font-black text-xl uppercase text-brand-red-deep">
              {q}
            </span>
          </label>
          {isSelected && (
            <div className="text-2xl font-bold text-brand-red">{hours[q]}h</div>
          )}
        </div>

        {isSelected && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                {QUICK_ADD_VALUES.map((val) => (
                  <button
                    key={`add-${val}`}
                    onClick={() => addHours(q, val)}
                    className="flex-1 py-2 px-1 bg-white border border-neutral-grey rounded-lg text-sm font-bold text-neutral-grey-deep hover:border-brand-red hover:text-brand-red transition-colors active:scale-95"
                  >
                    +{val}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {QUICK_ADD_VALUES.map((val) => (
                  <button
                    key={`sub-${val}`}
                    onClick={() => addHours(q, -val)}
                    className="flex-1 py-2 px-1 bg-white border border-neutral-grey rounded-lg text-sm font-bold text-neutral-grey-deep hover:border-brand-red hover:text-brand-red transition-colors active:scale-95"
                  >
                    -{val}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-grey-deep uppercase">
                Manual:
              </span>
              <input
                type="number"
                value={hours[q] || ""}
                onChange={(e) => {
                  setError(null);
                  setHours({ ...hours, [q]: Number(e.target.value) });
                }}
                className="w-24 bg-white border-b-2 border-neutral-grey focus:border-brand-red px-2 py-1 text-lg font-bold text-right outline-none"
                placeholder="0"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-neutral-grey-soft bg-neutral-grey-soft/30">
          <h3 className="text-2xl font-black text-brand-red-deep mb-1">
            Asignar Horas
          </h3>
          <p className="text-neutral-grey-deep font-medium">
            {initiative.workName}
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 text-brand-red rounded-2xl font-bold text-center animate-in fade-in zoom-in duration-200">
              {error}
            </div>
          )}

          {/* Trimestre Objetivo (Siempre visible y destacado) */}
          <div className="mb-6">{renderQuarterInput(targetQuarter)}</div>

          {/* Botón para mostrar otros */}
          {!showAllQuarters && (
            <button
              onClick={() => setShowAllQuarters(true)}
              className="w-full py-3 flex items-center justify-center gap-2 text-neutral-grey-deep font-bold hover:text-brand-red transition-colors border-2 border-dashed border-neutral-grey-soft rounded-xl hover:border-brand-red-soft"
            >
              <Plus size={20} />
              Asignar a otros trimestres
            </button>
          )}

          {/* Otros Trimestres */}
          {showAllQuarters && (
            <div className="space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="flex items-center gap-2 text-neutral-grey-deep mb-2">
                <span className="h-px flex-1 bg-neutral-grey-soft"></span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  Trimestres Adicionales
                </span>
                <span className="h-px flex-1 bg-neutral-grey-soft"></span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(["q1", "q2", "q3", "q4"] as Quarter[])
                  .filter((q) => q !== targetQuarter)
                  .map((q) => renderQuarterInput(q))}
              </div>
              <button
                onClick={() => setShowAllQuarters(false)}
                className="w-full py-2 flex items-center justify-center gap-1 text-sm text-neutral-grey hover:text-brand-red"
              >
                <ChevronUp size={16} /> Ocultar otros
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-neutral-grey-soft bg-neutral-grey-soft/30 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-8 py-4 rounded-xl font-bold text-neutral-grey-deep hover:bg-neutral-grey-soft transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-10 py-4 rounded-xl bg-brand-red text-white font-bold shadow-lg hover:bg-brand-red-deep transition-all active:scale-95"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
