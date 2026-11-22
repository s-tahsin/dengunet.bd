import type { District, Hospital, PlanAction, Pharmacy, RiskResult } from "@/types";
import { RISK_LABEL } from "./risk";
import { findShortages, MEDICINE_LABEL } from "./supply";

/**
 * Coordinator Agent (prototype: rule-based).
 * Looks at what changed, asks the other agents for their view of the affected
 * district, and builds one action plan that a human admin approves or overrides.
 */
export function buildPlan(
  districtId: string,
  districts: District[],
  hospitals: Hospital[],
  pharmacies: Pharmacy[],
  risk: Record<string, RiskResult>,
): PlanAction[] {
  const d = districts.find((x) => x.id === districtId);
  const r = risk[districtId];
  if (!d || !r) return [];
  const name = (id: string) => districts.find((x) => x.id === id)?.name ?? id;
  const actions: PlanAction[] = [];
  const stamp = Date.now();

  actions.push({
    id: `${stamp}-risk`,
    agent: "Risk",
    title: `Set ${d.name} to ${RISK_LABEL[r.level].toLowerCase()} risk on the public map`,
    reason: r.reasons.join(", "),
    status: "pending",
  });

  const local = hospitals.filter((h) => h.district === districtId);
  const full = local.filter((h) => h.freeBeds / Math.max(h.dengueBeds, 1) < 0.08);
  const roomy = hospitals
    .filter((h) => h.district !== districtId && h.freeBeds >= 15)
    .map((h) => ({ h, km: Math.hypot(h.lat - d.lat, h.lng - d.lng) * 111 }))
    .filter((x) => x.km < 80)
    .sort((a, b) => a.km - b.km)[0];
  if (full.length > 0 && roomy) {
    actions.push({
      id: `${stamp}-hospital`,
      agent: "Hospital",
      title: `Send new non-critical patients from ${full.map((h) => h.name).join(", ")} to ${roomy.h.name}`,
      reason: `${full.length} hospital(s) in ${d.name} are over 92% full; ${roomy.h.name} has ${roomy.h.freeBeds} free beds, ${roomy.km.toFixed(0)} km away`,
      status: "pending",
    });
  }

  findShortages(districts, pharmacies, risk)
    .filter((a) => a.districtId === districtId && a.fromDistrictId)
    .slice(0, 2)
    .forEach((a) =>
      actions.push({
        id: `${stamp}-supply-${a.medicine}`,
        agent: "Supply",
        title: `Move ${a.units} units of ${MEDICINE_LABEL[a.medicine]} from ${name(a.fromDistrictId!)} to ${d.name}`,
        reason: `${a.pharmaciesShort} of ${a.pharmaciesTotal} pharmacies in ${d.name} are low or out`,
        status: "pending",
      }),
    );

  return actions;
}
