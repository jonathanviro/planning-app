import { useNavigate } from "react-router-dom";
import TotemLayout from "../components/TotemLayout";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  return (
    <TotemLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard Gerencial</h1>
        <button
          onClick={() => navigate("/")}
          className="text-brand-red font-semibold"
        >
          Volver
        </button>
      </div>
      <div className="bg-white rounded-3xl p-8 shadow-sm h-full">
        <p className="text-neutral-grey-deep">Gráficos globales aquí</p>
      </div>
    </TotemLayout>
  );
}
