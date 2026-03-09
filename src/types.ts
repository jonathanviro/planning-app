export const IT_BUSINESS_PARTNERS = [
  "Andy Sánchez",
  "Danny Pérez",
  "Edwin Calderón",
  "Leslye Pérez",
  "Randol Benavides",
  "Saúl Bohórquez",
] as const;

export type ITBusinessPartner = (typeof IT_BUSINESS_PARTNERS)[number];

export type Stream =
  | "Finance"
  | "Formulation"
  | "HR"
  | "HSE"
  | "IT"
  | "Marketing"
  | "Procurement"
  | "Projects"
  | "Quality"
  | "Sales"
  | "SCM - Logistics"
  | "SCM - Operations"
  | "SMO";
export type WorkType =
  | "Operative Initiative"
  | "SP Company Project"
  | "SP Functional Project";
export type Priority = "Must Have" | "Nice to Have";
export type Classification = "AI" | "Power App" | "Project" | "PWA" | "Report";
export type Quarter = "q1" | "q2" | "q3" | "q4";

export interface Initiative {
  id: string;
  stream: Stream;
  workType: WorkType;
  itBusinessPartner: ITBusinessPartner;
  workName: string;
  priority: Priority;
  classification: Classification;
  hours: { q1: number; q2: number; q3: number; q4: number; total: number };
  assignedQuarters?: Quarter[];
}

export type Assignments = Record<string, Quarter[]>;
