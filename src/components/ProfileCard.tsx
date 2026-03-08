import clsx from "clsx";

type Props = {
  id: string;
  name: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function ProfileCard({ id, name, selectedId, onSelect }: Props) {
  const isActive = selectedId === id;
  return (
    <div
      onClick={() => onSelect(id)}
      className={clsx(
        "relative overflow-hidden bg-white rounded-3xl p-6 shadow-lg border-2 cursor-pointer transition-all duration-300 group",
        isActive
          ? "border-brand-red shadow-brand-red/30 shadow-2xl scale-105 ring-4 ring-brand-red-soft"
          : "border-transparent hover:border-brand-red-soft hover:shadow-xl hover:-translate-y-2",
      )}
    >
      {/* Elemento decorativo de fondo */}
      <div
        className={clsx(
          "absolute -top-12 -right-12 w-40 h-40 rounded-full transition-all duration-500 ease-out",
          isActive
            ? "bg-brand-red/10 scale-150"
            : "bg-brand-red-soft/40 group-hover:scale-110",
        )}
      />

      <div
        className={clsx(
          "relative w-28 h-28 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl font-bold transition-all duration-300 shadow-sm",
          isActive
            ? "bg-brand-red text-white scale-110"
            : "bg-neutral-grey-soft text-brand-red group-hover:bg-brand-red group-hover:text-white",
        )}
      >
        {name.charAt(0)}
      </div>
      <h2
        className={clsx(
          "relative text-2xl font-bold text-center transition-colors duration-300",
          isActive
            ? "text-brand-red"
            : "text-neutral-grey-deep group-hover:text-brand-red-deep",
        )}
      >
        {name}
      </h2>
    </div>
  );
}
