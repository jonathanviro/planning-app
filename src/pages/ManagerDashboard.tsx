import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
} from "recharts";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Award,
  ArrowLeft,
  Activity,
} from "lucide-react";
import clsx from "clsx";

import TotemLayout from "../components/TotemLayout";
import { usePlanningStore } from "../store";
import { QUARTER_LIMITS } from "../data";
import { IT_BUSINESS_PARTNERS } from "../types";
import type { Quarter } from "../types";

// Paleta de colores corporativa extendida
const COLORS = [
  "#c8102e", // Brand Red
  "#49060c", // Brand Red Deep
  "#84888b", // Neutral Grey Deep
  "#d0d0d1", // Neutral Grey
  "#f2f3f3", // Neutral Grey Soft
  "#ff8c00", // Accent Orange (para alertas o destacados)
  "#2e2e2e", // Dark
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent > 0.05 ? (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={10}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const initiatives = usePlanningStore((state) => state.initiatives);
  const fetchInitiatives = usePlanningStore((state) => state.fetchInitiatives);
  const [topCount, setTopCount] = useState(10);
  const [pieChartValueType, setPieChartValueType] = useState<
    "percent" | "hours"
  >("percent");

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);

  // --- LÓGICA DE DATOS Y KPIs ---

  const kpis = useMemo(() => {
    const totalUsers = IT_BUSINESS_PARTNERS.length;
    const globalCapacity = QUARTER_LIMITS.total * totalUsers;
    const totalAssignedHours = initiatives.reduce(
      (acc, i) => acc + i.hours.total,
      0,
    );
    const avgUtilization = (totalAssignedHours / globalCapacity) * 100;

    // Carga por usuario
    const userLoads = IT_BUSINESS_PARTNERS.map((partner) => {
      const hours = initiatives
        .filter((i) => i.itBusinessPartner === partner)
        .reduce((acc, i) => acc + i.hours.total, 0);
      return { name: partner, hours };
    });

    const maxLoadUser = userLoads.reduce((prev, current) =>
      prev.hours > current.hours ? prev : current,
    );
    const minLoadUser = userLoads.reduce((prev, current) =>
      prev.hours < current.hours ? prev : current,
    );

    return {
      avgUtilization,
      maxLoadUser,
      minLoadUser,
      totalAssignedHours,
      globalCapacity,
    };
  }, [initiatives]);

  // 1. Distribución de Horas por Work Type
  const hoursByWorkType = useMemo(() => {
    const data = initiatives.reduce(
      (acc, curr) => {
        acc[curr.workType] = (acc[curr.workType] || 0) + curr.hours.total;
        return acc;
      },
      {} as Record<string, number>,
    );
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [initiatives]);

  // 2. Conteo por Stream
  const countByStream = useMemo(() => {
    const data = initiatives.reduce(
      (acc, curr) => {
        acc[curr.stream] = (acc[curr.stream] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Ordenar descendente
  }, [initiatives]);

  // 3. Conteo por Classification
  const countByClassification = useMemo(() => {
    const data = initiatives.reduce(
      (acc, curr) => {
        acc[curr.classification] = (acc[curr.classification] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [initiatives]);

  // 4. Horas por Prioridad
  const hoursByPriority = useMemo(() => {
    const data = initiatives.reduce(
      (acc, curr) => {
        acc[curr.priority] = (acc[curr.priority] || 0) + curr.hours.total;
        return acc;
      },
      {} as Record<string, number>,
    );
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [initiatives]);

  // 5. Distribución Trimestral Global (Apilada)
  const quarterlyData = useMemo(() => {
    return (["q1", "q2", "q3", "q4"] as Quarter[]).map((q) => {
      const entry: any = { name: q.toUpperCase() };
      initiatives.forEach((init) => {
        // Solo sumar si está asignado al trimestre
        if (init.assignedQuarters?.includes(q)) {
          entry[init.workType] = (entry[init.workType] || 0) + init.hours[q];
        }
      });
      return entry;
    });
  }, [initiatives]);

  // 6. Carga por ITBP
  const partnerLoadData = useMemo(() => {
    return IT_BUSINESS_PARTNERS.map((partner) => {
      const hours = initiatives
        .filter((i) => i.itBusinessPartner === partner)
        .reduce((acc, i) => acc + i.hours.total, 0);
      return { name: partner.split(" ")[0], fullName: partner, hours }; // Nombre corto para eje X
    });
  }, [initiatives]);

  // 8. Top 5 Iniciativas
  const topInitiatives = useMemo(() => {
    return [...initiatives]
      .sort((a, b) => b.hours.total - a.hours.total)
      .slice(0, topCount);
  }, [initiatives, topCount]);

  return (
    <TotemLayout>
      {/* HEADER & NAVEGACIÓN */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-black text-brand-red-deep">
            Resumen Gerencial
          </h1>
          <p className="text-neutral-grey-deep text-lg">
            Visión Estratégica Global 2026
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-neutral-grey-soft rounded-2xl text-brand-red font-bold hover:bg-brand-red-soft transition-colors shadow-sm"
        >
          <ArrowLeft size={20} />
          Volver al Inicio
        </button>
      </div>

      {/* FILA 1: KPIs DE ALTO NIVEL */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-brand-red flex items-center gap-4">
          <div className="p-3 bg-brand-red-soft rounded-full text-brand-red">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-neutral-grey-deep font-bold uppercase">
              Utilización Global
            </p>
            <p className="text-3xl font-black text-brand-red-deep">
              {kpis.avgUtilization.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-yellow-500 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-neutral-grey-deep font-bold uppercase">
              Mayor Carga
            </p>
            <p className="text-lg font-bold text-brand-red-deep leading-tight">
              {kpis.maxLoadUser.name.split(" ")[0]}
            </p>
            <p className="text-xs text-neutral-grey-deep">
              {kpis.maxLoadUser.hours}h
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-green-500 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-neutral-grey-deep font-bold uppercase">
              Menor Carga
            </p>
            <p className="text-lg font-bold text-brand-red-deep leading-tight">
              {kpis.minLoadUser.name.split(" ")[0]}
            </p>
            <p className="text-xs text-neutral-grey-deep">
              {kpis.minLoadUser.hours}h
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-500 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-neutral-grey-deep font-bold uppercase">
              Horas Totales
            </p>
            <p className="text-3xl font-black text-brand-red-deep">
              {kpis.totalAssignedHours}
            </p>
            <p className="text-xs text-neutral-grey-deep">
              / {kpis.globalCapacity}h Capacidad
            </p>
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL (Scroll natural) */}
      <div className="flex flex-col gap-6 pb-10">
        {/* SECCIÓN 1: TOP INICIATIVAS (Primero, como solicitado) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-grey-soft">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-black text-brand-red-deep flex items-center gap-2">
              <Award size={28} className="text-yellow-500" />
              Top Iniciativas por Horas
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-neutral-grey-deep">
                Mostrar:
              </span>
              <select
                value={topCount}
                onChange={(e) => setTopCount(Number(e.target.value))}
                className="bg-neutral-grey-soft/50 border border-neutral-grey-soft rounded-lg px-3 py-1 text-brand-red-deep font-bold focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={20}>Top 20</option>
                <option value={25}>Top 25</option>
                <option value={50}>Top 50</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topInitiatives.map((init, idx) => (
              <div
                key={init.id}
                className="flex flex-col p-3 bg-neutral-grey-soft/30 rounded-xl border border-neutral-grey-soft hover:border-brand-red-soft transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-brand-red text-white flex items-center justify-center font-black text-sm shadow-sm mt-1">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-brand-red-deep text-base leading-tight">
                        {init.workName}
                      </p>
                      <p className="text-xs text-neutral-grey-deep font-medium mt-1">
                        {init.itBusinessPartner} • {init.workType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right pl-2 shrink-0">
                    <span className="block text-2xl font-black text-brand-red leading-none">
                      {init.hours.total}h
                    </span>
                    <span className="text-[9px] text-neutral-grey-deep uppercase font-bold tracking-wider">
                      Total Anual
                    </span>
                  </div>
                </div>
                {init.assignedQuarters && init.assignedQuarters.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-grey-soft/80">
                    <span className="text-xs font-bold text-neutral-grey-deep">
                      Asignado a:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {init.assignedQuarters.sort().map((q) => (
                        <span
                          key={q}
                          className="bg-brand-red/10 text-brand-red text-[10px] font-bold px-1.5 py-0.5 rounded"
                        >
                          {q.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN 2: GRÁFICOS (Grid de 2 columnas) */}
        <div className="flex justify-between items-center mt-4">
          <h2 className="text-3xl font-black text-brand-red-deep">
            Métricas Globales
          </h2>
          <div className="bg-white p-1 rounded-lg shadow-md flex text-xs">
            <button
              onClick={() => setPieChartValueType("percent")}
              className={clsx(
                "px-3 py-1 rounded-md font-bold transition-colors",
                pieChartValueType === "percent"
                  ? "bg-brand-red text-white"
                  : "text-neutral-grey-deep hover:bg-neutral-grey-soft",
              )}
            >
              Ver en %
            </button>
            <button
              onClick={() => setPieChartValueType("hours")}
              className={clsx(
                "px-3 py-1 rounded-md font-bold transition-colors",
                pieChartValueType === "hours"
                  ? "bg-brand-red text-white"
                  : "text-neutral-grey-deep hover:bg-neutral-grey-soft",
              )}
            >
              Ver en Horas
            </button>
          </div>
        </div>

        {/* SECCIÓN 2: GRÁFICOS (Grid de 2 columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Inversión por Tipo de Trabajo */}
          <div className="bg-white p-6 rounded-3xl shadow-sm h-96 flex flex-col">
            <h3 className="text-xl font-bold text-brand-red-deep mb-2 text-center">
              Inversión por Tipo de Trabajo
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hoursByWorkType}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={
                      pieChartValueType === "percent"
                        ? renderCustomizedLabel
                        : true
                    }
                  >
                    {hoursByWorkType.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconSize={10}
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Enfoque por Prioridad */}
          <div className="bg-white p-6 rounded-3xl shadow-sm h-96 flex flex-col">
            <h3 className="text-xl font-bold text-brand-red-deep mb-4 text-center">
              Enfoque por Prioridad
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hoursByPriority}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={
                      pieChartValueType === "percent"
                        ? renderCustomizedLabel
                        : true
                    }
                  >
                    {hoursByPriority.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={
                          entry.name === "Must Have" ? COLORS[0] : COLORS[3]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconSize={10}
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: Carga Trimestral Global */}
          <div className="bg-white p-6 rounded-3xl shadow-sm h-96 flex flex-col">
            <h3 className="text-xl font-bold text-brand-red-deep mb-4 text-center">
              Carga Trimestral Global
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={quarterlyData}
                  margin={{ top: 40, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fontWeight: "bold" }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} iconSize={10} />
                  <Bar
                    dataKey="Operative Initiative"
                    stackId="a"
                    fill={COLORS[0]}
                  >
                    <LabelList
                      dataKey="Operative Initiative"
                      position="inside"
                      fill="white"
                      fontSize={10}
                      formatter={(v: any) => (v > 0 ? v : "")}
                    />
                  </Bar>
                  <Bar
                    dataKey="SP Company Project"
                    stackId="a"
                    fill={COLORS[1]}
                  >
                    <LabelList
                      dataKey="SP Company Project"
                      position="inside"
                      fill="white"
                      fontSize={10}
                      formatter={(v: any) => (v > 0 ? v : "")}
                    />
                  </Bar>
                  <Bar
                    dataKey="SP Functional Project"
                    stackId="a"
                    fill={COLORS[2]}
                  >
                    <LabelList
                      dataKey="SP Functional Project"
                      position="inside"
                      fill="white"
                      fontSize={10}
                      formatter={(v: any) => (v > 0 ? v : "")}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 4: Carga por IT Business Partner */}
          <div className="bg-white p-6 rounded-3xl shadow-sm h-96 flex flex-col">
            <h3 className="text-xl font-bold text-brand-red-deep mb-4 text-center">
              Carga por IT Business Partner
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={partnerLoadData}
                  layout="vertical"
                  margin={{ right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <ReferenceLine
                    x={QUARTER_LIMITS.total}
                    stroke="red"
                    strokeDasharray="3 3"
                  />
                  <Bar dataKey="hours" fill={COLORS[2]} barSize={25}>
                    <LabelList
                      dataKey="hours"
                      position="right"
                      fill="#49060c"
                      fontSize={12}
                      fontWeight="bold"
                    />
                    {partnerLoadData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.hours > QUARTER_LIMITS.total
                            ? COLORS[0]
                            : COLORS[2]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 5: Volumen por Stream */}
          <div className="bg-white p-6 rounded-3xl shadow-sm h-96 flex flex-col">
            <h3 className="text-xl font-bold text-brand-red-deep mb-4 text-center">
              Volumen de Iniciativas por Stream
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={countByStream}
                  layout="vertical"
                  margin={{ left: 10, right: 30 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={90}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[1]} barSize={15}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      fill="#49060c"
                      fontSize={11}
                      fontWeight="bold"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 6: Tecnología (Clasificación) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm h-96 flex flex-col">
            <h3 className="text-xl font-bold text-brand-red-deep mb-4 text-center">
              Tecnología (Clasificación)
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={countByClassification}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {countByClassification.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconSize={10}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </TotemLayout>
  );
}
