import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
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
  LabelList,
} from "recharts";
import clsx from "clsx";
import { BarChart3, Search } from "lucide-react";

import TotemLayout from "../components/TotemLayout";
import InitiativeCard, {
  InitiativeCardView,
} from "../components/InitiativeCard";
import QuarterZone from "../components/QuarterZone";
import QuarterModal from "../components/QuarterModal";
import AssignmentModal from "../components/AssignmentModal";
import ConfirmationModal from "../components/ConfirmationModal";

import { usePlanningStore } from "../store";
import { QUARTER_LIMITS } from "../data";
import type { Quarter, Initiative } from "../types";

const COLORS = ["#c8102e", "#49060c", "#84888b", "#d0d0d1", "#f2f3f3"];

const STREAMS = [
  "Finance",
  "Formulation",
  "HR",
  "HSE",
  "IT",
  "Marketing",
  "Procurement",
  "Projects",
  "Quality",
  "Sales",
  "SCM - Logistics",
  "SCM - Operations",
  "SMO",
];
const WORK_TYPES = [
  "Operative Initiative",
  "SP Company Project",
  "SP Functional Project",
];
const PRIORITIES = ["Must Have", "Nice to Have"];
const CLASSIFICATIONS = ["AI", "Power App", "Project", "PWA", "Report"];

export default function UserDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [backlogTab, setBacklogTab] = useState<"pending" | "all">("pending");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [areChartsVisible, setAreChartsVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStream, setFilterStream] = useState("all");
  const [filterWorkType, setFilterWorkType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterClassification, setFilterClassification] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitiative, setModalInitiative] = useState<Initiative | null>(
    null,
  );
  const [modalTargetQuarter, setModalTargetQuarter] = useState<Quarter | null>(
    null,
  );
  const [expandedQuarter, setExpandedQuarter] = useState<Quarter | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    initiativeId: string | null;
    quarterId: Quarter | null;
  }>({ isOpen: false, initiativeId: null, quarterId: null });

  // Store
  const initiatives = usePlanningStore((state) => state.initiatives);
  const assignments = usePlanningStore((state) => state.assignments);
  const quarterlyDeliverables = usePlanningStore(
    (state) => state.quarterlyDeliverables,
  );
  const assignToQuarter = usePlanningStore((state) => state.assignToQuarter);
  const removeFromQuarter = usePlanningStore(
    (state) => state.removeFromQuarter,
  );
  const updateInitiativeHours = usePlanningStore(
    (state) => state.updateInitiativeHours,
  );
  const getUserStats = usePlanningStore((state) => state.getUserStats);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Datos derivados
  const userName = id || "";
  const userInitiatives = initiatives.filter(
    (i) => i.itBusinessPartner === userName,
  );
  const stats = getUserStats(userName);
  const activeInitiative = activeId
    ? userInitiatives.find((i) => i.id === activeId)
    : null;

  // Preparación de Datos para Gráficos
  const pieWorkTypeData = Object.values(
    userInitiatives.reduce(
      (acc, curr) => {
        acc[curr.workType] = (acc[curr.workType] || 0) + curr.hours.total;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map((value, index, arr) => ({
    name: Object.keys(
      userInitiatives.reduce(
        (acc, curr) => {
          acc[curr.workType] = 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    )[index],
    value,
  }));

  const pieStreamData = Object.entries(
    userInitiatives.reduce(
      (acc, curr) => {
        acc[curr.stream] = (acc[curr.stream] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }));

  const pieClassData = Object.entries(
    userInitiatives.reduce(
      (acc, curr) => {
        acc[curr.classification] = (acc[curr.classification] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }));

  const barData = (["q1", "q2", "q3", "q4"] as Quarter[]).map((q) => {
    const data: any = { name: q.toUpperCase() };
    userInitiatives.forEach((init) => {
      if (assignments[init.id]?.includes(q)) {
        data[init.workType] = (data[init.workType] || 0) + init.hours[q];
      }
    });
    return data;
  });

  // Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active) {
      const init = userInitiatives.find((i) => i.id === active.id);
      if (init) {
        setModalInitiative(init);
        setModalTargetQuarter(over.id as Quarter);
        setIsModalOpen(true);
      }
    }
  };

  const handleModalSave = (
    hours: Record<Quarter, number>,
    quarters: Quarter[],
  ) => {
    if (modalInitiative) {
      updateInitiativeHours(modalInitiative.id, hours);
      quarters.forEach((q) => {
        assignToQuarter(modalInitiative.id, q);
      });
    }
  };

  const handleEditInitiative = (initiative: Initiative, quarter: Quarter) => {
    setModalInitiative(initiative);
    setModalTargetQuarter(quarter);
    setIsModalOpen(true);
  };

  const handleRemoveRequest = (initiativeId: string, quarter: Quarter) => {
    setConfirmModal({ isOpen: true, initiativeId, quarterId: quarter });
  };

  const handleConfirmRemove = () => {
    if (confirmModal.initiativeId && confirmModal.quarterId) {
      removeFromQuarter(confirmModal.initiativeId, confirmModal.quarterId);
    }
    setConfirmModal({ isOpen: false, initiativeId: null, quarterId: null });
  };

  const getQuarterInitiatives = (q: Quarter) => {
    // Usamos quarterlyDeliverables para mantener el orden de inserción
    const ids = quarterlyDeliverables[q] || [];
    return ids
      .map((id) => initiatives.find((i) => i.id === id))
      .filter(
        (i): i is Initiative =>
          i !== undefined && i.itBusinessPartner === userName,
      );
  };

  const backlogInitiatives = userInitiatives.filter((init) => {
    const isAssigned = assignments[init.id] && assignments[init.id].length > 0;

    // Filtro de Pestaña (Pendientes vs Todas)
    if (backlogTab === "pending" && isAssigned) return false;

    // Filtros de Texto y Propiedades
    if (
      searchQuery &&
      !init.workName.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    if (filterStream !== "all" && init.stream !== filterStream) return false;
    if (filterWorkType !== "all" && init.workType !== filterWorkType)
      return false;
    if (filterPriority !== "all" && init.priority !== filterPriority)
      return false;
    if (
      filterClassification !== "all" &&
      init.classification !== filterClassification
    )
      return false;

    return true;
  });

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <TotemLayout>
        {/* BLOQUE 1: Header Unificado (Nuevo Diseño) */}
        <div className="bg-white p-3 rounded-[2rem] shadow-sm mb-6 flex items-center justify-between gap-6 pr-6">
          {/* Perfil */}
          <div className="flex items-center gap-4 bg-neutral-grey-soft/30 p-2 pr-6 rounded-[1.5rem]">
            <div className="w-14 h-14 rounded-full bg-brand-red text-white flex items-center justify-center text-2xl font-bold shadow-sm ring-2 ring-white">
              {userName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-black text-brand-red-deep leading-tight">
                {userName}
              </h1>
            </div>
          </div>

          {/* Barra de Progreso Central */}
          <div className="flex-1 flex flex-col justify-center max-w-2xl px-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-neutral-grey-deep uppercase tracking-wider">
                Capacidad Anual
              </span>
              <div className="text-right">
                <span className="text-2xl font-black text-brand-red">
                  {stats.totalUsed}
                </span>
                <span className="text-lg text-neutral-grey-deep font-medium">
                  {" "}
                  / {QUARTER_LIMITS.total}h
                </span>
              </div>
            </div>
            <div className="w-full h-4 bg-neutral-grey-soft rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-red transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(100, (stats.totalUsed / QUARTER_LIMITS.total) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAreChartsVisible(!areChartsVisible)}
              className={clsx(
                "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border-2",
                areChartsVisible
                  ? "border-brand-red-soft bg-brand-red-soft/30 text-brand-red"
                  : "border-neutral-grey-soft bg-white text-neutral-grey-deep hover:border-brand-red-soft",
              )}
            >
              <BarChart3 size={20} />
              <span>{areChartsVisible ? "Ocultar" : "Métricas"}</span>
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-3 rounded-2xl font-bold text-neutral-grey-deep hover:bg-neutral-grey-soft transition-all"
            >
              Salir
            </button>
          </div>
        </div>

        {/* BLOQUES 2 y 3: Gráficos (Colapsables) */}
        {areChartsVisible && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6 mb-6 flex-none">
            {/* Fila 1: Gráficos de Pastel (2 columnas) */}
            <div className="grid grid-cols-2 gap-6 h-80">
              {/* Gráfico 1: Horas por Work Type */}
              <div className="bg-white rounded-3xl p-4 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-neutral-grey-deep mb-2 text-center">
                  Horas por Work Type
                </h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieWorkTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {pieWorkTypeData.map((_, index) => (
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
                        wrapperStyle={{ fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 2: Trabajos por Clasificación */}
              <div className="bg-white rounded-3xl p-4 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-neutral-grey-deep mb-2 text-center">
                  Trabajos por Clasificación
                </h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieClassData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {pieClassData.map((_, index) => (
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
                        wrapperStyle={{ fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Fila 2: Gráficos de Barras (2 columnas) */}
            <div className="grid grid-cols-2 gap-6 h-80">
              {/* Gráfico 3: Trabajos por Stream (Nuevo Bar Chart) */}
              <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-brand-red-deep mb-2 text-center">
                  Trabajos por Stream
                </h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={pieStreamData}
                      margin={{ top: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={60}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={COLORS[1]} name="Cantidad">
                        <LabelList
                          dataKey="value"
                          position="top"
                          fill="black"
                          fontSize={12}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 4: Distribución Trimestral (Existente) */}
              <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-brand-red-deep mb-2 text-center">
                  Distribución Trimestral por Work Type
                </h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />
                      <Bar
                        dataKey="Operative Initiative"
                        stackId="a"
                        fill={COLORS[0]}
                        name="Operative"
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
                        name="Company Project"
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
                        name="Functional Project"
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
            </div>
          </div>
        )}

        {/* BLOQUE 4: Trimestres (4 columnas) */}
        <div
          className={clsx(
            "grid grid-cols-4 gap-6 mb-6 flex-none transition-all duration-500 ease-in-out",
            areChartsVisible ? "h-[450px]" : "h-[650px]",
          )}
        >
          {(["q1", "q2", "q3", "q4"] as Quarter[]).map((q) => (
            <QuarterZone
              key={q}
              id={q}
              title={q.toUpperCase()}
              limit={QUARTER_LIMITS[q]}
              used={stats[`${q}Used` as keyof typeof stats]}
              initiatives={getQuarterInitiatives(q)}
              onRemove={(initId) => handleRemoveRequest(initId, q)}
              onEdit={(init) => handleEditInitiative(init, q)}
              onExpand={() => setExpandedQuarter(q)}
            />
          ))}
        </div>

        {/* BLOQUE 5: Backlog */}
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-t-3xl p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-brand-red-deep">
                Backlog de Iniciativas
              </h2>
              <div className="flex bg-neutral-grey-soft rounded-lg p-1">
                <button
                  onClick={() => setBacklogTab("pending")}
                  className={clsx(
                    "px-6 py-2 rounded-md text-sm font-bold transition-all",
                    backlogTab === "pending"
                      ? "bg-white text-brand-red shadow-sm"
                      : "text-neutral-grey-deep hover:text-brand-red",
                  )}
                >
                  Pendientes
                </button>
                <button
                  onClick={() => setBacklogTab("all")}
                  className={clsx(
                    "px-6 py-2 rounded-md text-sm font-bold transition-all",
                    backlogTab === "all"
                      ? "bg-white text-brand-red shadow-sm"
                      : "text-neutral-grey-deep hover:text-brand-red",
                  )}
                >
                  Todas
                </button>
              </div>
            </div>

            {/* Barra de Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-grey-deep"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-grey-soft bg-neutral-grey-soft/30 focus:border-brand-red focus:bg-white outline-none transition-all text-sm font-medium"
                />
              </div>

              <select
                value={filterStream}
                onChange={(e) => setFilterStream(e.target.value)}
                className="px-3 py-2 rounded-xl border border-neutral-grey-soft bg-neutral-grey-soft/30 focus:border-brand-red focus:bg-white outline-none transition-all text-sm font-medium cursor-pointer"
              >
                <option value="all">Todos los Streams</option>
                {STREAMS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={filterWorkType}
                onChange={(e) => setFilterWorkType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-neutral-grey-soft bg-neutral-grey-soft/30 focus:border-brand-red focus:bg-white outline-none transition-all text-sm font-medium cursor-pointer"
              >
                <option value="all">Todos los Tipos</option>
                {WORK_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 rounded-xl border border-neutral-grey-soft bg-neutral-grey-soft/30 focus:border-brand-red focus:bg-white outline-none transition-all text-sm font-medium cursor-pointer"
              >
                <option value="all">Todas las Prioridades</option>
                {PRIORITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={filterClassification}
                onChange={(e) => setFilterClassification(e.target.value)}
                className="px-3 py-2 rounded-xl border border-neutral-grey-soft bg-neutral-grey-soft/30 focus:border-brand-red focus:bg-white outline-none transition-all text-sm font-medium cursor-pointer"
              >
                <option value="all">Todas las Clasificaciones</option>
                {CLASSIFICATIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-4 gap-4">
              {backlogInitiatives.map((init) => (
                <InitiativeCard
                  key={init.id}
                  initiative={init}
                  isAssigned={
                    assignments[init.id] && assignments[init.id].length > 0
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeInitiative ? (
            <InitiativeCardView initiative={activeInitiative} isOverlay />
          ) : null}
        </DragOverlay>

        <AssignmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
          initiative={modalInitiative}
          targetQuarter={modalTargetQuarter}
        />

        <QuarterModal
          isOpen={!!expandedQuarter}
          onClose={() => setExpandedQuarter(null)}
          quarterId={expandedQuarter}
          title={expandedQuarter?.toUpperCase() || ""}
          initiatives={
            expandedQuarter ? getQuarterInitiatives(expandedQuarter) : []
          }
          limit={expandedQuarter ? QUARTER_LIMITS[expandedQuarter] : 0}
          used={
            expandedQuarter
              ? stats[`${expandedQuarter}Used` as keyof typeof stats]
              : 0
          }
          onRemove={(initId) =>
            expandedQuarter && handleRemoveRequest(initId, expandedQuarter)
          }
          onEdit={(init) =>
            expandedQuarter && handleEditInitiative(init, expandedQuarter)
          }
        />

        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={handleConfirmRemove}
        />
      </TotemLayout>
    </DndContext>
  );
}
