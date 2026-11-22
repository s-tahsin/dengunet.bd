export type RiskLevel = "very-high" | "high" | "moderate" | "low";

export interface District {
  id: string;
  name: string;
  division: string;
  lat: number;
  lng: number;
  cases7d: number;
  casesPrev7d: number;
  rainfall7dMm: number;
  dengueBeds: number;
  freeBeds: number;
}

export interface RiskResult {
  districtId: string;
  score: number; // 0-100
  level: RiskLevel;
  growth: number; // cases this week / last week
  reasons: string[];
  forecast: RiskLevel[]; // next 7 days
}

export interface Hospital {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  dengueBeds: number;
  freeBeds: number;
  icuBeds: number;
  icuFree: number;
  phone: string;
  type: "Government" | "Private";
}

export type Medicine = "saline" | "ors" | "paracetamol" | "ns1Kit";

export interface Pharmacy {
  id: string;
  name: string;
  district: string;
  area: string;
  lat: number;
  lng: number;
  stock: Record<Medicine, number>;
  open24h: boolean;
  phone: string;
}

export interface Ambulance {
  id: string;
  name: string;
  district: string;
  phone: string;
  kind: "Government" | "Private";
  available24h: boolean;
}

export type AgentName = "Risk" | "Hospital" | "Supply" | "Coordinator";

export interface AgentEvent {
  id: string;
  time: string;
  agent: AgentName;
  message: string;
}

export interface PlanAction {
  id: string;
  agent: AgentName;
  title: string;
  reason: string;
  status: "pending" | "approved" | "overridden";
  districtId?: string;
}

export type Role = "public" | "hospital" | "admin";

export interface SessionUser {
  name: string;
  role: Role;
  districtId: string;
  hospitalId?: string;
}
