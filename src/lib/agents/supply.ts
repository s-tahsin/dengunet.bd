import type { District, Medicine, Pharmacy, RiskResult } from "@/types";

/**
 * Supply Monitoring Agent (prototype: rule-based).
 * Flags districts where a key medicine is low or out in a high-risk area,
 * then suggests a low-risk district with spare stock to send it from.
 */
export const MEDICINE_LABEL: Record<Medicine, string> = {
  saline: "IV saline",
  ors: "ORS",
  paracetamol: "Paracetamol",
  ns1Kit: "NS1 test kit",
};

export const LOW_STOCK = 40;

export interface ShortageAlert {
  id: string;
  districtId: string;
  medicine: Medicine;
  pharmaciesShort: number;
  pharmaciesTotal: number;
  fromDistrictId: string | null;
  units: number;
}

export function findShortages(
  districts: District[],
  pharmacies: Pharmacy[],
  risk: Record<string, RiskResult>,
): ShortageAlert[] {
  const meds = Object.keys(MEDICINE_LABEL) as Medicine[];
  const byDistrict = new Map<string, Pharmacy[]>();
  pharmacies.forEach((p) => byDistrict.set(p.district, [...(byDistrict.get(p.district) ?? []), p]));

  const spare = (m: Medicine, id: string) =>
    (byDistrict.get(id) ?? []).reduce((sum, p) => sum + Math.max(0, p.stock[m] - 100), 0);

  const alerts: ShortageAlert[] = [];
  for (const d of districts) {
    const r = risk[d.id];
    if (!r || (r.level !== "very-high" && r.level !== "high")) continue;
    const list = byDistrict.get(d.id) ?? [];
    for (const m of meds) {
      const short = list.filter((p) => p.stock[m] < LOW_STOCK).length;
      if (short === 0 || short / list.length < 0.5) continue;
      const donor = districts
        .filter((x) => risk[x.id]?.level === "low" || risk[x.id]?.level === "moderate")
        .map((x) => ({ id: x.id, spare: spare(m, x.id) }))
        .sort((a, b) => b.spare - a.spare)[0];
      alerts.push({
        id: `${d.id}-${m}`,
        districtId: d.id,
        medicine: m,
        pharmaciesShort: short,
        pharmaciesTotal: list.length,
        fromDistrictId: donor && donor.spare > 0 ? donor.id : null,
        units: donor ? Math.min(donor.spare, 500) : 0,
      });
    }
  }
  return alerts.sort((a, b) => risk[b.districtId].score - risk[a.districtId].score);
}
