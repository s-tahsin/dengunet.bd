"use client";

import { useApp } from "@/lib/store";
import type { AgentName } from "@/types";

export const AGENT_COLOR: Record<AgentName, string> = {
  Risk: "var(--risk-very-high)",
  Hospital: "var(--brand)",
  Supply: "#6b4fa1",
  Coordinator: "var(--ink)",
};

export default function AgentFeed({ limit = 6 }: { limit?: number }) {
  const { events } = useApp();
  return (
    <ol className="flex flex-col gap-2.5" aria-live="polite">
      {events.slice(0, limit).map((e) => (
        <li key={e.id} className="grid grid-cols-[3.2rem_1fr] gap-2 text-[13.5px] leading-snug">
          <span className="tabular pt-px text-muted">{e.time}</span>
          <span>
            <span className="font-semibold" style={{ color: AGENT_COLOR[e.agent] }}>
              {e.agent} agent
            </span>{" "}
            {e.message}
          </span>
        </li>
      ))}
    </ol>
  );
}
