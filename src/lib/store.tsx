"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AgentEvent, District, Hospital, PlanAction, Pharmacy, Ambulance, RiskResult, SessionUser } from "@/types";
import districtData from "@/data/districts.json";
import hospitalData from "@/data/hospitals.json";
import pharmacyData from "@/data/pharmacies.json";
import ambulanceData from "@/data/ambulances.json";
import { assessAll, RISK_LABEL } from "@/lib/agents/risk";
import { buildPlan } from "@/lib/agents/coordinator";
import { findShortages, MEDICINE_LABEL } from "@/lib/agents/supply";

interface AppState {
  districts: District[];
  hospitals: Hospital[];
  pharmacies: Pharmacy[];
  ambulances: Ambulance[];
  risk: Record<string, RiskResult>;
  draft: District[];
  draftRisk: Record<string, RiskResult>;
  events: AgentEvent[];
  plan: PlanAction[];
  simulateOutbreak: (districtId: string, caseMultiplier: number, rainfallMm: number) => void;
  decide: (actionId: string, status: "approved" | "overridden") => void;
  resetData: () => void;
  user: SessionUser | null;
  signIn: (u: SessionUser) => void;
  signOut: () => void;
  updateHospital: (id: string, freeBeds: number, icuFree: number) => void;
}

const SESSION_KEY = "denguenet-user";

const Ctx = createContext<AppState | null>(null);

const now = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function starterEvents(): AgentEvent[] {
  const ds = districtData as District[];
  const risk = assessAll(ds);
  const name = (id: string) => ds.find((d) => d.id === id)?.name ?? id;
  const dhaka = risk["dhaka"];
  const shortage = findShortages(ds, pharmacyData as Pharmacy[], risk).find((a) => a.fromDistrictId);
  const events: AgentEvent[] = [
    { id: "e1", time: "09:30", agent: "Risk", message: `Dhaka stays ${RISK_LABEL[dhaka.level].toLowerCase()}: ${dhaka.reasons.join(", ")}.` },
    { id: "e2", time: "09:32", agent: "Hospital", message: "Dhaka Medical College Hospital has no free dengue beds. New patients are pointed to Mugda Medical College Hospital." },
  ];
  if (shortage) {
    events.push({
      id: "e3",
      time: "09:40",
      agent: "Supply",
      message: `${MEDICINE_LABEL[shortage.medicine]} low in ${shortage.pharmaciesShort} of ${shortage.pharmaciesTotal} pharmacies in ${name(shortage.districtId)}. Suggested ${shortage.units} units from ${name(shortage.fromDistrictId!)}.`,
    });
  }
  return events.reverse();
}
const STARTER_EVENTS = starterEvents();

export function AppProvider({ children }: { children: React.ReactNode }) {
  // `districts` is what the public sees. `draft` holds new reports the agents have assessed
  // but an admin has not approved yet (human in the loop).
  const [districts, setDistricts] = useState<District[]>(districtData as District[]);
  const [draft, setDraft] = useState<District[]>(districtData as District[]);
  const [hospitals, setHospitals] = useState<Hospital[]>(hospitalData as Hospital[]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(pharmacyData as Pharmacy[]);
  const [events, setEvents] = useState<AgentEvent[]>(STARTER_EVENTS);
  const [plan, setPlan] = useState<PlanAction[]>([]);
  const ambulances = ambulanceData as Ambulance[];
  const risk = useMemo(() => assessAll(districts), [districts]);
  const draftRisk = useMemo(() => assessAll(draft), [draft]);

  const log = (agent: AgentEvent["agent"], message: string) =>
    ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: now(), agent, message }) as AgentEvent;

  const simulateOutbreak = useCallback(
    (districtId: string, caseMultiplier: number, rainfallMm: number) => {
      const before = draftRisk[districtId];
      // New reports arrive: more cases, more rain, fuller hospitals, emptier pharmacy shelves.
      const nextDraft = draft.map((d) =>
        d.id === districtId
          ? {
              ...d,
              casesPrev7d: d.cases7d,
              cases7d: Math.round(d.cases7d * caseMultiplier),
              rainfall7dMm: rainfallMm,
              freeBeds: Math.max(0, Math.round(d.freeBeds / caseMultiplier)),
            }
          : d,
      );
      const nextHospitals = hospitals.map((h) =>
        h.district === districtId
          ? { ...h, freeBeds: Math.floor(h.freeBeds / (caseMultiplier * 2.5)), icuFree: Math.floor(h.icuFree / caseMultiplier) }
          : h,
      );
      const nextPharmacies = pharmacies.map((p) =>
        p.district === districtId
          ? {
              ...p,
              stock: Object.fromEntries(
                Object.entries(p.stock).map(([m, q]) => [m, Math.floor(q / (caseMultiplier * 2))]),
              ) as Pharmacy["stock"],
            }
          : p,
      );
      const nextRisk = assessAll(nextDraft);
      const d = nextDraft.find((x) => x.id === districtId)!;
      const after = nextRisk[districtId];
      const actions = buildPlan(districtId, nextDraft, nextHospitals, nextPharmacies, nextRisk).map((a) =>
        a.agent === "Risk" ? { ...a, districtId } : a,
      );
      setDraft(nextDraft);
      setHospitals(nextHospitals);
      setPharmacies(nextPharmacies);
      setPlan(actions);
      setEvents((ev) => [
        log("Coordinator", `Built a plan with ${actions.length} action(s) for ${d.name}. Waiting for admin approval.`),
        ...actions
          .filter((a) => a.agent !== "Risk")
          .map((a) => log(a.agent, `Suggests: ${a.title}.`)),
        log(
          "Risk",
          `${d.name}: ${RISK_LABEL[before.level].toLowerCase()} → ${RISK_LABEL[after.level].toLowerCase()} (score ${before.score} → ${after.score}). ${after.reasons.join(", ")}.`,
        ),
        ...ev,
      ]);
    },
    [draft, draftRisk, hospitals, pharmacies],
  );

  const decide = useCallback(
    (actionId: string, status: "approved" | "overridden") => {
      const a = plan.find((x) => x.id === actionId);
      if (!a) return;
      setPlan((p) => p.map((x) => (x.id === actionId ? { ...x, status } : x)));
      if (status === "approved" && a.agent === "Risk" && a.districtId) {
        const updated = draft.find((d) => d.id === a.districtId)!;
        setDistricts((ds) => ds.map((d) => (d.id === a.districtId ? updated : d)));
      }
      setEvents((ev) => [
        log("Coordinator", `Admin ${status === "approved" ? "approved" : "overrode"}: ${a.title}.`),
        ...ev,
      ]);
    },
    [plan, draft],
  );

  const resetData = useCallback(() => {
    setDistricts(districtData as District[]);
    setDraft(districtData as District[]);
    setHospitals(hospitalData as Hospital[]);
    setPharmacies(pharmacyData as Pharmacy[]);
    setPlan([]);
    setEvents(STARTER_EVENTS);
  }, []);

  // Prototype sign-in: kept in this browser tab only (Supabase Auth replaces this later).
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring the tab's session once on load
      if (saved) setUser(JSON.parse(saved));
    } catch {}
  }, []);
  const signIn = useCallback((u: SessionUser) => {
    setUser(u);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
    } catch {}
  }, []);
  const signOut = useCallback(() => {
    setUser(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);

  const updateHospital = useCallback(
    (id: string, freeBeds: number, icuFree: number) => {
      const h = hospitals.find((x) => x.id === id);
      if (!h) return;
      setHospitals((hs) => hs.map((x) => (x.id === id ? { ...x, freeBeds, icuFree } : x)));
      setEvents((ev) => [
        log("Hospital", `${h.name} updated: ${freeBeds} dengue beds and ${icuFree} ICU beds free.`),
        ...ev,
      ]);
    },
    [hospitals],
  );

  const value = {
    districts, draft, hospitals, pharmacies, ambulances, risk, draftRisk, events, plan,
    simulateOutbreak, decide, resetData, user, signIn, signOut, updateHospital,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}
