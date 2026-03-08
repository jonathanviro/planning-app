import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TotemLayout from "../components/TotemLayout";
import ProfileCard from "../components/ProfileCard";
import { IT_BUSINESS_PARTNERS } from "../types";

export default function SelectProfile() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => navigate(`/user/${id}`), 400);
  };

  return (
    <TotemLayout>
      <div className="flex flex-col h-full justify-center">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black text-brand-red mb-2 tracking-tight">
            Planificación ITBP
          </h1>
          <p className="text-2xl text-neutral-grey-deep font-light">
            Toca tu tarjeta para comenzar
          </p>
        </div>

        <div className="grid grid-cols-2 gap-30 mb-30 flex-1 content-center px-15">
          {IT_BUSINESS_PARTNERS.map((name) => (
            <ProfileCard
              key={name}
              id={name}
              name={name}
              selectedId={selected}
              onSelect={handleSelect}
            />
          ))}
        </div>

        <button
          onClick={() => navigate("/manager")}
          className="w-full py-6 rounded-2xl text-2xl font-bold bg-white text-brand-red border-2 border-brand-red shadow-lg hover:bg-brand-red hover:text-white hover:shadow-xl active:scale-95 transition-all duration-300 cursor-pointer"
        >
          Vista Gerencial Global
        </button>
      </div>
    </TotemLayout>
  );
}
