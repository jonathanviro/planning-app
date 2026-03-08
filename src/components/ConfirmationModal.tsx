import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar eliminación",
  message = "¿Estás seguro de que deseas eliminar esta actividad del trimestre?",
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-neutral-grey-soft flex justify-between items-center bg-neutral-grey-soft/30">
          <h3 className="text-xl font-black text-brand-red-deep">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-grey-soft rounded-full transition-colors text-neutral-grey-deep hover:text-brand-red"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-neutral-grey-deep font-medium text-lg">
            {message}
          </p>
        </div>
        <div className="p-6 border-t border-neutral-grey-soft bg-neutral-grey-soft/30 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-neutral-grey-deep hover:bg-neutral-grey-soft transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-3 rounded-xl bg-brand-red text-white font-bold shadow-lg hover:bg-brand-red-deep transition-all active:scale-95"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
