"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/lib/store";
import { RISK_LABEL, RISK_ORDER } from "@/lib/agents/risk";

const AXIS = { fontSize: 12, fill: "#56655f" };
const RISK_HEX = { "very-high": "#a51f2b", high: "#dc5a19", moderate: "#e0a91a", low: "#2f8f4c" } as const;

function useByDivision() {
  const { districts, risk } = useApp();
  return useMemo(() => {
    const rows = new Map<string, Record<string, number | string>>();
    for (const d of districts) {
      const r = rows.get(d.division) ?? { division: d.division, cases: 0, "very-high": 0, high: 0, moderate: 0, low: 0 };
      r.cases = (r.cases as number) + d.cases7d;
      r[risk[d.id].level] = (r[risk[d.id].level] as number) + 1;
      rows.set(d.division, r);
    }
    return [...rows.values()].sort((a, b) => (b.cases as number) - (a.cases as number));
  }, [districts, risk]);
}

export function CasesByDivision() {
  const data = useByDivision();
  return (
    <figure>
      <figcaption className="text-[15px] font-semibold">Cases this week, by division</figcaption>
      <div className="mt-2 h-[260px]">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barCategoryGap={6}>
            <CartesianGrid horizontal={false} stroke="#e6ece9" />
            <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="division" tick={AXIS} axisLine={false} tickLine={false} width={84} />
            <Tooltip
              cursor={{ fill: "rgba(11,93,69,0.06)" }}
              formatter={(v) => [Number(v).toLocaleString(), "Cases"]}
              contentStyle={{ borderRadius: 6, borderColor: "#d9e1dd", fontSize: 13 }}
            />
            <Bar dataKey="cases" fill="#0b5d45" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

export function RiskByDivision() {
  const data = useByDivision();
  return (
    <figure>
      <figcaption className="text-[15px] font-semibold">Districts at each risk level, by division</figcaption>
      <div className="mt-2 h-[260px]">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barCategoryGap={6}>
            <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="division" tick={AXIS} axisLine={false} tickLine={false} width={84} />
            <Tooltip
              cursor={{ fill: "rgba(11,93,69,0.06)" }}
              contentStyle={{ borderRadius: 6, borderColor: "#d9e1dd", fontSize: 13 }}
            />
            <Legend
              verticalAlign="top"
              height={28}
              content={() => (
                <ul className="flex flex-wrap gap-x-4 gap-y-1 pb-2 text-[12.5px] text-ink">
                  {RISK_ORDER.map((l) => (
                    <li key={l} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: RISK_HEX[l] }} />
                      {RISK_LABEL[l]}
                    </li>
                  ))}
                </ul>
              )}
            />
            {RISK_ORDER.map((l, i) => (
              <Bar
                key={l}
                dataKey={l}
                name={RISK_LABEL[l]}
                stackId="risk"
                fill={RISK_HEX[l]}
                stroke="#ffffff"
                strokeWidth={2}
                radius={i === RISK_ORDER.length - 1 ? [0, 4, 4, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
