import type { District, RiskLevel, RiskResult } from "@/types";

/**
 * Risk Prediction Agent (prototype: rule-based).
 * Combines weekly cases, week-on-week growth and rainfall into a 0-100 score.
 * Explains every score with plain-language reasons.
 */
export function levelFromScore(score: number): RiskLevel {
  if (score >= 70) return "very-high";
  if (score >= 50) return "high";
  if (score >= 30) return "moderate";
  return "low";
}

const clamp = (v: number) => Math.max(0, Math.min(100, v));

export function assessDistrict(d: District): RiskResult {
  const growth = d.cases7d / Math.max(d.casesPrev7d, 1);
  const caseScore = clamp(d.cases7d / 10); // 1,000 cases a week = 100
  const growthScore = clamp(((growth - 0.8) / 0.8) * 100); // 1.6x growth = 100
  const rainScore = clamp((d.rainfall7dMm / 150) * 100); // 150 mm a week = 100
  const score = Math.round(0.5 * caseScore + 0.3 * growthScore + 0.2 * rainScore);

  const reasons: string[] = [];
  reasons.push(`${d.cases7d.toLocaleString()} cases in the last 7 days`);
  const pct = Math.round((growth - 1) * 100);
  reasons.push(pct >= 0 ? `cases up ${pct}% on last week` : `cases down ${Math.abs(pct)}% on last week`);
  if (d.rainfall7dMm >= 100) reasons.push(`heavy rain (${d.rainfall7dMm} mm this week)`);
  const bedShare = d.freeBeds / Math.max(d.dengueBeds, 1);
  if (bedShare < 0.1) reasons.push(`only ${Math.round(bedShare * 100)}% of dengue beds free`);

  // Simple forecast: keep the trend going, with rain keeping mosquitoes breeding for a few days.
  const forecast: RiskLevel[] = [];
  let s = score;
  for (let day = 0; day < 7; day++) {
    const trend = (growth - 1) * 6 - (day > 3 ? 4 : 0) + (d.rainfall7dMm > 110 ? 1 : -1);
    s = clamp(s + trend);
    forecast.push(levelFromScore(s));
  }

  return { districtId: d.id, score, level: levelFromScore(score), growth, reasons, forecast };
}

export function assessAll(districts: District[]): Record<string, RiskResult> {
  return Object.fromEntries(districts.map((d) => [d.id, assessDistrict(d)]));
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  "very-high": "Very high",
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

export const RISK_ORDER: RiskLevel[] = ["very-high", "high", "moderate", "low"];
