import type { District, Hospital } from "@/types";
import { distanceKm } from "@/lib/geo";

/**
 * Hospital Allocation Agent (prototype: rule-based ranking).
 * Scores each hospital on being in the patient's own district, free beds,
 * ICU need, distance and current load, and returns a primary and backup
 * choice with reasons.
 */
export type Severity = "mild" | "warning-signs" | "severe";

export interface PatientRequest {
  districtId: string;
  severity: Severity;
  needsIcu: boolean;
}

export interface HospitalChoice {
  hospital: Hospital;
  distanceKm: number;
  score: number;
  reasons: string[];
}

/**
 * Where the patient starts: the district town, not the middle of the district
 * shape (large districts like Khulna stretch far from their town). The town is
 * taken as the district's main hospital, which sits in the town.
 */
function startPoint(districtId: string, districts: District[], hospitals: Hospital[]) {
  const local = hospitals
    .filter((h) => h.district === districtId && h.type === "Government")
    .sort((a, b) => b.dengueBeds - a.dengueBeds);
  if (local.length > 0) return { lat: local[0].lat, lng: local[0].lng };
  const d = districts.find((x) => x.id === districtId);
  return d ? { lat: d.lat, lng: d.lng } : null;
}

export function recommendHospitals(
  req: PatientRequest,
  districts: District[],
  hospitals: Hospital[],
): HospitalChoice[] {
  const origin = startPoint(req.districtId, districts, hospitals);
  if (!origin) return [];
  const maxKm = req.severity === "severe" ? 120 : 60;

  const choices = hospitals
    .map((h) => {
      const km = distanceKm(origin.lat, origin.lng, h.lat, h.lng);
      const load = 1 - h.freeBeds / Math.max(h.dengueBeds, 1);
      const sameDistrict = h.district === req.districtId;
      const reasons: string[] = [];
      let score = 0;

      if (h.freeBeds === 0) return null;
      if (req.needsIcu && h.icuFree === 0) return null;
      if (km > maxKm) return null;

      if (sameDistrict) {
        score += 25;
        reasons.push("in your district");
      }
      score += Math.min(h.freeBeds, 30) * 1.2;
      reasons.push(`${h.freeBeds} dengue beds free`);
      if (req.needsIcu) {
        score += h.icuFree * 12;
        reasons.push(`${h.icuFree} ICU beds free`);
      } else if (req.severity === "severe" && h.icuBeds > 0) {
        score += 20;
        reasons.push("has an ICU if the patient gets worse");
      }
      score -= km * (req.severity === "severe" ? 0.4 : 0.8);
      reasons.push(`${km < 1 ? "under 1" : km.toFixed(1)} km away`);
      score -= load * 15;
      if (load > 0.9) reasons.push("almost full, expect a wait");
      return { hospital: h, distanceKm: km, score: Math.round(score), reasons };
    })
    .filter((c): c is HospitalChoice => c !== null)
    .sort((a, b) => b.score - a.score);

  return choices.slice(0, 3);
}
