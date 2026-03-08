import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Assignments, Initiative, Quarter } from "./types";
import { INITIAL_INITIATIVES } from "./data";

interface PlanningState {
  initiatives: Initiative[];
  assignments: Assignments;
  quarterlyDeliverables: Record<Quarter, string[]>; // Para mantener el orden de inserción
  assignToQuarter: (initiativeId: string, quarter: Quarter) => void;
  removeFromQuarter: (initiativeId: string, quarter: Quarter) => void;
  updateInitiativeHours: (
    initiativeId: string,
    hours: Partial<Record<Quarter, number>>,
  ) => void;
  resetAssignments: () => void;
  getInitiativesByUser: (user: string) => Initiative[];
  getUserStats: (user: string) => {
    q1Used: number;
    q2Used: number;
    q3Used: number;
    q4Used: number;
    totalUsed: number;
  };
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => ({
      initiatives: INITIAL_INITIATIVES,
      assignments: INITIAL_INITIATIVES.reduce((acc, init) => {
        const quarters: Quarter[] = [];
        if (init.hours.q1 > 0) quarters.push("q1");
        if (init.hours.q2 > 0) quarters.push("q2");
        if (init.hours.q3 > 0) quarters.push("q3");
        if (init.hours.q4 > 0) quarters.push("q4");
        if (quarters.length > 0) acc[init.id] = quarters;
        return acc;
      }, {} as Assignments),
      quarterlyDeliverables: INITIAL_INITIATIVES.reduce(
        (acc, init) => {
          (["q1", "q2", "q3", "q4"] as Quarter[]).forEach((q) => {
            if (init.hours[q] > 0) {
              if (!acc[q]) acc[q] = [];
              acc[q].push(init.id);
            }
          });
          return acc;
        },
        {} as Record<Quarter, string[]>,
      ),
      assignToQuarter: (id, q) =>
        set((state) => {
          const current = state.assignments[id] || [];
          const currentDeliverables = state.quarterlyDeliverables[q] || [];

          if (current.includes(q)) return state;

          return {
            assignments: { ...state.assignments, [id]: [...current, q] },
            quarterlyDeliverables: {
              ...state.quarterlyDeliverables,
              [q]: [...currentDeliverables, id], // Agregamos al final
            },
          };
        }),
      removeFromQuarter: (id, q) =>
        set((state) => {
          const current = state.assignments[id] || [];
          const next = current.filter((x) => x !== q);
          const newAssignments = { ...state.assignments };
          if (next.length === 0) delete newAssignments[id];
          else newAssignments[id] = next;

          const currentDeliverables = state.quarterlyDeliverables[q] || [];
          const newDeliverables = currentDeliverables.filter((x) => x !== id);

          return {
            assignments: newAssignments,
            quarterlyDeliverables: {
              ...state.quarterlyDeliverables,
              [q]: newDeliverables,
            },
          };
        }),
      updateInitiativeHours: (id, newHours) =>
        set((state) => ({
          initiatives: state.initiatives.map((init) => {
            if (init.id !== id) return init;
            const updatedHours = { ...init.hours, ...newHours };
            updatedHours.total =
              updatedHours.q1 +
              updatedHours.q2 +
              updatedHours.q3 +
              updatedHours.q4;
            return { ...init, hours: updatedHours };
          }),
        })),
      resetAssignments: () => set({ assignments: {} }),
      getInitiativesByUser: (user) =>
        get().initiatives.filter((i) => i.itBusinessPartner === user),
      getUserStats: (user) => {
        const { initiatives, assignments } = get();
        const stats = {
          q1Used: 0,
          q2Used: 0,
          q3Used: 0,
          q4Used: 0,
          totalUsed: 0,
        };
        initiatives
          .filter((i) => i.itBusinessPartner === user)
          .forEach((i) => {
            const assigned = assignments[i.id] || [];
            if (assigned.includes("q1")) stats.q1Used += i.hours.q1;
            if (assigned.includes("q2")) stats.q2Used += i.hours.q2;
            if (assigned.includes("q3")) stats.q3Used += i.hours.q3;
            if (assigned.includes("q4")) stats.q4Used += i.hours.q4;
          });
        stats.totalUsed =
          stats.q1Used + stats.q2Used + stats.q3Used + stats.q4Used;
        return stats;
      },
    }),
    { name: "planning-storage-v5" },
  ),
);
