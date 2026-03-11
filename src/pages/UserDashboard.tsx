import { useState, useEffect } from "react";
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
import jsPDF from "jspdf";
import clsx from "clsx";
import { BarChart3, Search, FileDown, Loader2 } from "lucide-react";

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

const RANDOL_TEAM_IMAGES = [
  "/profiles/randol.jpg",
  "/profiles/rommel.jpg",
  "/profiles/julian.jpg",
];

// Mapa de imágenes (duplicado de SelectProfile para acceso aquí)
const PROFILE_IMAGES: Record<string, string[]> = {
  "Andy Sánchez": ["/profiles/andy.jpg"],
  "Danny Pérez": ["/profiles/danny.jpg"],
  "Edwin Calderón": ["/profiles/edwin.jpg"],
  "Leslye Pérez": ["/profiles/leslye.jpg"],
  "Randol Benavides": [
    "/profiles/randol.jpg",
    "/profiles/rommel.jpg",
    "/profiles/julian.jpg",
  ],
  "Saúl Bohórquez": ["/profiles/saul.jpg"],
};

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
  const fetchInitiatives = usePlanningStore((state) => state.fetchInitiatives);
  const isLoading = usePlanningStore((state) => state.isLoading);

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

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);

  // Datos derivados
  const userName = id || "";
  const userInitiatives = initiatives.filter(
    (i) => i.itBusinessPartner === userName,
  );
  const stats = getUserStats(userName);
  const activeInitiative = activeId
    ? userInitiatives.find((i) => i.id === activeId)
    : null;
  const userImage = PROFILE_IMAGES[userName]?.[0];

  // Preparación de Datos para Gráficos
  const pieWorkTypeData = Object.values(
    userInitiatives.reduce(
      (acc, curr) => {
        acc[curr.workType] = (acc[curr.workType] || 0) + curr.hours.total;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map((value, index) => ({
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
      if (init.assignedQuarters?.includes(q)) {
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
      // Preparamos las horas: si un trimestre no está seleccionado en el modal,
      // debemos asegurarnos de enviar 0 horas para ese trimestre.
      const hoursToSend = { ...hours };
      (["q1", "q2", "q3", "q4"] as Quarter[]).forEach((q) => {
        if (!quarters.includes(q)) {
          hoursToSend[q] = 0;
        }
      });
      updateInitiativeHours(modalInitiative.id, hoursToSend);
    }
  };

  const handleEditInitiative = (initiative: Initiative, quarter: Quarter) => {
    if (initiative.workType !== "Operative Initiative") return;
    setModalInitiative(initiative);
    setModalTargetQuarter(quarter);
    setIsModalOpen(true);
  };

  const handleRemoveRequest = (initiativeId: string, quarter: Quarter) => {
    const initiative = initiatives.find((i) => i.id === initiativeId);
    if (initiative?.workType !== "Operative Initiative") return;
    setConfirmModal({ isOpen: true, initiativeId, quarterId: quarter });
  };

  const handleConfirmRemove = () => {
    const { initiativeId, quarterId } = confirmModal;
    if (initiativeId && quarterId) {
      const initiative = initiatives.find((i) => i.id === initiativeId);
      if (initiative) {
        const updatedHours = {
          [quarterId]: 0,
        };
        updateInitiativeHours(initiativeId, updatedHours);
      }
    }
    setConfirmModal({ isOpen: false, initiativeId: null, quarterId: null });
  };

  const getQuarterInitiatives = (q: Quarter) => {
    // Filtramos directamente las iniciativas que tienen el quarter asignado
    return initiatives.filter(
      (i) =>
        i.itBusinessPartner === userName && i.assignedQuarters?.includes(q),
    );
  };

  const backlogInitiatives = userInitiatives.filter((init) => {
    const isAssigned =
      init.assignedQuarters && init.assignedQuarters.length > 0;

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

  // --- LÓGICA DE GENERACIÓN DE PDF ---
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    
    try {
      const doc = new jsPDF();
      let y = 20; // Posición vertical inicial
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;

      // Helper para saltar de página
      const checkPageBreak = (spaceNeeded: number) => {
        if (y + spaceNeeded > pageHeight - margin) {
          doc.addPage();
          y = 20;
        }
      };

      // --- ENCABEZADO ---
      doc.setFontSize(22);
      doc.setTextColor(200, 16, 46); // Brand Red
      doc.text("Planificación Estratégica 2026", margin, y);
      y += 10;

      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`IT Business Partner: ${userName}`, margin, y);
      y += 8;
      doc.text(
        `Capacidad Utilizada: ${stats.totalUsed}h / ${QUARTER_LIMITS.total}h`,
        margin,
        y,
      );
      y += 15;

      // LÍNEA SEPARADORA
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, 190, y);
      y += 10;

      // --- TABLAS POR TRIMESTRE ---
      const quarters: Quarter[] = ["q1", "q2", "q3", "q4"];

      quarters.forEach((q) => {
        checkPageBreak(60); // Verificar espacio para título y al menos un par de filas

        // Título Trimestre
        doc.setFontSize(16);
        doc.setTextColor(200, 16, 46);
        doc.text(
          `Trimestre ${q.toUpperCase()} (${stats[`${q}Used` as keyof typeof stats]}h / ${QUARTER_LIMITS[q]}h)`,
          margin,
          y,
        );
        y += 8;

        // Encabezados de Tabla
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("Iniciativa", margin, y);
        doc.text("Tipo", 100, y);
        doc.text("Horas", 170, y);
        y += 2;
        doc.line(margin, y, 190, y); // Línea bajo encabezado
        y += 6;

        // Filas
        doc.setFont("helvetica", "normal");
        const qInitiatives = getQuarterInitiatives(q);

        if (qInitiatives.length === 0) {
          doc.setTextColor(150);
          doc.text("Sin asignaciones", margin, y);
          y += 10;
        } else {
          doc.setTextColor(50);
          qInitiatives.forEach((init) => {
            checkPageBreak(10);
            const title =
              init.workName.length > 40
                ? init.workName.substring(0, 37) + "..."
                : init.workName;
            doc.text(title, margin, y);
            doc.text(init.workType.split(" ")[0], 100, y); // "Operative", "SP"
            doc.text(`${init.hours[q]}h`, 170, y);
            y += 7;
          });
          y += 5; // Espacio extra entre trimestres
        }
      });

      doc.save(`Planificacion_2026_${userName.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Error generando PDF:", error);
    }
    setIsGeneratingPdf(false);
  };

  if (isLoading) {
    return (
      <TotemLayout>
        <div className="flex-1 flex items-center justify-center text-2xl text-neutral-grey-deep font-bold">
          Cargando iniciativas...
        </div>
      </TotemLayout>
    );
  }

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
            {userName === "Randol Benavides" ? (
              <div className="flex -space-x-4 pl-2">
                {RANDOL_TEAM_IMAGES.map((img, i) => (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-full border-2 border-white overflow-hidden relative z-10 shadow-sm"
                  >
                    <img
                      src={img}
                      alt="Team Member"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand-red text-white flex items-center justify-center text-2xl font-bold shadow-sm ring-2 ring-white overflow-hidden">
                {userImage ? (
                  <img
                    src={userImage}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userName.charAt(0)
                )}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-brand-red-deep leading-tight">
                {userName === "Randol Benavides"
                  ? "Randol, Rommel, Julian"
                  : userName}
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
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold bg-neutral-grey-deep text-white hover:bg-neutral-grey transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isGeneratingPdf ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <FileDown size={20} />
              )}
              <span>{isGeneratingPdf ? "Generando..." : "PDF"}</span>
            </button>
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
                      <Tooltip formatter={(value: any) => `${value}h`} />
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
                      <Tooltip
                        formatter={(value: any) => [value, "Iniciativas"]}
                      />
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
                      <Tooltip
                        formatter={(value: any) => [value, "Iniciativas"]}
                      />
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
                      <Tooltip formatter={(value: any) => `${value}h`} />
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
                          formatter={(v: any) => (v > 0 ? `${v}h` : "")}
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
                          formatter={(v: any) => (v > 0 ? `${v}h` : "")}
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
                          formatter={(v: any) => (v > 0 ? `${v}h` : "")}
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
                <span className="ml-2 text-lg font-medium text-neutral-grey-deep">
                  ({backlogInitiatives.length})
                </span>
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
                    !!(
                      init.assignedQuarters && init.assignedQuarters.length > 0
                    )
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

        {/* --- VISTA OCULTA PARA IMPRESIÓN (TABLAS) --- */}
        <div
          id="pdf-print-view"
          className="absolute -top-[9999px] -left-[9999px] w-[1000px] bg-white p-10"
        >
          {/* Header PDF */}
          <div className="flex items-center justify-between border-b-4 border-brand-red pb-4 mb-8">
            <div>
              <h1 className="text-4xl font-black text-brand-red-deep">
                Planificación Estratégica 2026
              </h1>
              <p className="text-xl text-neutral-grey-deep mt-1">
                IT Business Partner:{" "}
                <span className="text-brand-red font-bold">{userName}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-neutral-grey-deep uppercase">
                Capacidad Utilizada
              </div>
              <div className="text-3xl font-black text-brand-red">
                {stats.totalUsed}h{" "}
                <span className="text-lg text-neutral-grey">
                  / {QUARTER_LIMITS.total}h
                </span>
              </div>
            </div>
          </div>

          {/* Tablas de Trimestres */}
          <div className="space-y-8">
            {(["q1", "q2", "q3", "q4"] as Quarter[]).map((q) => {
              const qInitiatives = getQuarterInitiatives(q);
              const limit = QUARTER_LIMITS[q];
              const used = stats[`${q}Used` as keyof typeof stats];
              const isExceeded = used > limit;

              return (
                <div key={q} className="break-inside-avoid">
                  <div className="flex justify-between items-end mb-2 px-2">
                    <h3 className="text-2xl font-black text-brand-red uppercase">
                      Trimestre {q}
                    </h3>
                    <span
                      className={clsx(
                        "font-bold",
                        isExceeded ? "text-brand-red" : "text-neutral-grey-deep",
                      )}
                    >
                      {used} / {limit} h
                    </span>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-grey-soft text-brand-red-deep text-sm uppercase">
                        <th className="p-2 rounded-l-lg">Iniciativa</th>
                        <th className="p-2">Tipo</th>
                        <th className="p-2">Prioridad</th>
                        <th className="p-2 text-right rounded-r-lg">Horas</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {qInitiatives.length > 0 ? (
                        qInitiatives.map((init, idx) => (
                          <tr
                            key={init.id}
                            className={idx % 2 === 0 ? "bg-white" : "bg-neutral-50"}
                          >
                            <td className="p-2 font-bold text-neutral-800 border-b border-neutral-100">
                              {init.workName}
                            </td>
                            <td className="p-2 text-neutral-600 border-b border-neutral-100">
                              {init.workType}
                            </td>
                            <td className="p-2 border-b border-neutral-100">
                              <span
                                className={clsx(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                  init.priority === "Must Have"
                                    ? "bg-brand-red/10 text-brand-red"
                                    : "bg-neutral-200 text-neutral-600",
                                )}
                              >
                                {init.priority}
                              </span>
                            </td>
                            <td className="p-2 text-right font-bold text-brand-red border-b border-neutral-100">
                              {init.hours[q]}h
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-4 text-center text-neutral-400 italic"
                          >
                            Sin asignaciones este trimestre
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Tabla de Backlog (No asignados) */}
            <div className="break-inside-avoid mt-8 pt-8 border-t-2 border-dashed border-neutral-300">
              <h3 className="text-2xl font-black text-neutral-600 uppercase mb-4 px-2">
                Backlog (Pendientes)
              </h3>
              <table className="w-full text-left border-collapse opacity-70">
                <thead>
                  <tr className="bg-neutral-200 text-neutral-600 text-sm uppercase">
                    <th className="p-2 rounded-l-lg">Iniciativa</th>
                    <th className="p-2">Stream</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2 rounded-r-lg">Prioridad</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {initiatives
                    .filter(
                      (i) =>
                        i.itBusinessPartner === userName &&
                        (!i.assignedQuarters || i.assignedQuarters.length === 0),
                    )
                    .map((init, idx) => (
                      <tr
                        key={init.id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-neutral-50"}
                      >
                        <td className="p-2 font-bold text-neutral-700 border-b border-neutral-100">
                          {init.workName}
                        </td>
                        <td className="p-2 text-neutral-600 border-b border-neutral-100">
                          {init.stream}
                        </td>
                        <td className="p-2 text-neutral-600 border-b border-neutral-100">
                          {init.workType}
                        </td>
                        <td className="p-2 border-b border-neutral-100">
                          <span
                            className={clsx(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                              init.priority === "Must Have"
                                ? "bg-brand-red/10 text-brand-red"
                                : "bg-neutral-200 text-neutral-600",
                            )}
                          >
                            {init.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </TotemLayout>
    </DndContext>
  );
}
