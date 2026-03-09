import { create } from "zustand";
import type { Initiative, Quarter } from "./types";

const API_URL = "https://planning-backend-production.up.railway.app";

interface PlanningState {
  initiatives: Initiative[];
  isLoading: boolean;
  error: string | null;
  fetchInitiatives: () => Promise<void>;
  assignToQuarter: (initiativeId: string, quarter: Quarter) => void;
  removeFromQuarter: (initiativeId: string, quarter: Quarter) => void;
  updateInitiativeHours: (
    initiativeId: string,
    hours: Partial<Record<Quarter, number>>,
  ) => void;
  resetAssignments: () => void;
  getUserStats: (user: string) => {
    q1Used: number;
    q2Used: number;
    q3Used: number;
    q4Used: number;
    totalUsed: number;
  };
}

export const usePlanningStore = create<PlanningState>((set, get) => ({
  initiatives: [],
  isLoading: false,
  error: null,

  fetchInitiatives: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/initiatives`);
      if (!res.ok) throw new Error("Failed to fetch initiatives");
      const data = await res.json();
      set({ initiatives: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  assignToQuarter: async (id, quarter) => {
    const { initiatives } = get();
    const initiative = initiatives.find((i) => i.id === id);
    if (!initiative) return;

    const currentQuarters = initiative.assignedQuarters || [];
    if (currentQuarters.includes(quarter)) return;

    const newQuarters = [...currentQuarters, quarter];

    // Optimistic update
    set({
      initiatives: initiatives.map((i) =>
        i.id === id ? { ...i, assignedQuarters: newQuarters } : i,
      ),
    });

    try {
      await fetch(`${API_URL}/initiatives/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedQuarters: newQuarters }),
      });
    } catch (error) {
      console.error("Failed to assign quarter", error);
      get().fetchInitiatives(); // Rollback on error
    }
  },

  removeFromQuarter: async (id, quarter) => {
    const { initiatives } = get();
    const initiative = initiatives.find((i) => i.id === id);
    if (!initiative) return;

    const newQuarters = (initiative.assignedQuarters || []).filter(
      (q) => q !== quarter,
    );

    // Optimistic update
    set({
      initiatives: initiatives.map((i) =>
        i.id === id ? { ...i, assignedQuarters: newQuarters } : i,
      ),
    });

    try {
      await fetch(`${API_URL}/initiatives/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedQuarters: newQuarters }),
      });
    } catch (error) {
      console.error("Failed to remove quarter", error);
      get().fetchInitiatives();
    }
  },

  updateInitiativeHours: async (id, hours) => {
    // Optimistic update
    set((state) => ({
      initiatives: state.initiatives.map((init) => {
        if (init.id !== id) return init;
        const updatedHours = { ...init.hours, ...hours };
        updatedHours.total =
          updatedHours.q1 + updatedHours.q2 + updatedHours.q3 + updatedHours.q4;

        // Actualizamos assignedQuarters localmente basándonos en las horas
        let newQuarters = init.assignedQuarters || [];
        (Object.keys(hours) as Quarter[]).forEach((q) => {
          const val = hours[q];
          if (val !== undefined) {
            if (val > 0) {
              if (!newQuarters.includes(q)) newQuarters = [...newQuarters, q];
            } else {
              newQuarters = newQuarters.filter((xq) => xq !== q);
            }
          }
        });
        return { ...init, hours: updatedHours, assignedQuarters: newQuarters };
      }),
    }));

    try {
      await fetch(`${API_URL}/initiatives/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
    } catch (error) {
      console.error("Failed to update hours", error);
      get().fetchInitiatives();
    }
  },

  resetAssignments: async () => {
    // Not implemented in backend yet or handled differently
  },

  getUserStats: (user) => {
    const { initiatives } = get();
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
        const assigned = i.assignedQuarters || [];
        if (assigned.includes("q1")) stats.q1Used += i.hours.q1;
        if (assigned.includes("q2")) stats.q2Used += i.hours.q2;
        if (assigned.includes("q3")) stats.q3Used += i.hours.q3;
        if (assigned.includes("q4")) stats.q4Used += i.hours.q4;
      });
    stats.totalUsed = stats.q1Used + stats.q2Used + stats.q3Used + stats.q4Used;
    return stats;
  },
}));
