import type { RiskLevel } from "@/types";
import { RISK_LABEL, RISK_ORDER } from "@/lib/agents/risk";

export const RISK_COLOR: Record<RiskLevel, string> = {
  "very-high": "var(--risk-very-high)",
  high: "var(--risk-high)",
  moderate: "var(--risk-moderate)",
  low: "var(--risk-low)",
};

// Text colour that stays readable on each fill
export const RISK_TEXT: Record<RiskLevel, string> = {
  "very-high": "#fff",
  high: "#fff",
  moderate: "#3b2a00",
  low: "#fff",
};

export function RiskBadge({ level, size = "md" }: { level: RiskLevel; size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ${size === "sm" ? "px-2 py-0 text-[12px]" : "px-2.5 py-0.5 text-[13px]"}`}
      style={{ background: RISK_COLOR[level], color: RISK_TEXT[level] }}
    >
      {RISK_LABEL[level]}
    </span>
  );
}

export function RiskLegend({ counts }: { counts?: Record<RiskLevel, number> }) {
  return (
    <ul className="flex flex-col gap-1.5 text-[13px]">
      {RISK_ORDER.map((l) => (
        <li key={l} className="flex items-center gap-2">
          <span className="h-3 w-4 rounded-sm" style={{ background: RISK_COLOR[l] }} />
          <span className="flex-1">{RISK_LABEL[l]}</span>
          {counts && <span className="tabular text-muted">{counts[l]}</span>}
        </li>
      ))}
    </ul>
  );
}
