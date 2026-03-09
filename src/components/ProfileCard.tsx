import clsx from "clsx";

type Props = {
  id: string;
  name: string;
  imageUrls?: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function ProfileCard({
  id,
  name,
  imageUrls,
  selectedId,
  onSelect,
}: Props) {
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

      {imageUrls && imageUrls.length > 1 ? (
        <div
          className={clsx(
            "flex justify-center -space-x-5 mb-4 mx-auto transition-all duration-300 h-28 items-center",
            isActive ? "scale-110" : "",
          )}
        >
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className={clsx(
                "w-16 h-16 rounded-full border-2 border-white overflow-hidden shadow-md relative z-10",
                isActive
                  ? "ring-2 ring-brand-red"
                  : "group-hover:ring-2 group-hover:ring-brand-red-soft",
              )}
            >
              <img
                src={url}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={clsx(
            "relative w-28 h-28 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl font-bold transition-all duration-300 shadow-sm overflow-hidden",
            isActive
              ? "bg-brand-red text-white scale-110"
              : "bg-neutral-grey-soft text-brand-red group-hover:bg-brand-red group-hover:text-white",
          )}
        >
          {imageUrls && imageUrls.length === 1 ? (
            <img
              src={imageUrls[0]}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            name.charAt(0)
          )}
        </div>
      )}
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
