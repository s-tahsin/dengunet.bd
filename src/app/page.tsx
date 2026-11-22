"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import RiskMapClient from "@/components/RiskMapClient";
import DistrictPanel from "@/components/DistrictPanel";
import AgentFeed from "@/components/AgentFeed";
import { RISK_COLOR, RiskLegend } from "@/components/Risk";
import { RISK_LABEL, RISK_ORDER } from "@/lib/agents/risk";
import type { MapLayers } from "@/components/RiskMap";
import type { RiskLevel } from "@/types";

export default function RiskMapPage() {
  const { districts, risk } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [layers, setLayers] = useState<MapLayers>({ hospitals: true, pharmacies: false });

  const ranked = useMemo(
    () => [...districts].sort((a, b) => risk[b.id].score - risk[a.id].score),
    [districts, risk],
  );
  const counts = useMemo(() => {
    const c: Record<RiskLevel, number> = { "very-high": 0, high: 0, moderate: 0, low: 0 };
    districts.forEach((d) => c[risk[d.id].level]++);
    return c;
  }, [districts, risk]);
  const filtered = ranked.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase()));
  const totalCases = districts.reduce((s, d) => s + d.cases7d, 0);

  return (
    <main className="flex h-[calc(100vh-6rem)] flex-col-reverse md:h-[calc(100vh-3.5rem)] lg:flex-row">
      <aside className="h-1/2 overflow-y-auto border-line bg-surface px-5 py-5 lg:h-auto lg:w-[420px] lg:border-r">
        {selected ? (
          <DistrictPanel id={selected} onBack={() => setSelected(null)} />
        ) : (
          <div className="flex flex-col">
            <h1 className="text-[24px] font-semibold leading-tight">Dengue risk in Bangladesh</h1>
            <p className="mt-1 text-[14px] text-muted">
              {totalCases.toLocaleString()} cases reported in the last 7 days. Colours are updated by the risk agent.
            </p>

            {/* All 64 districts in one strip, most dangerous on the left */}
            <div className="mt-4" aria-hidden>
              <div className="flex h-7 overflow-hidden rounded-md">
                {ranked.map((d) => (
                  <button
                    key={d.id}
                    tabIndex={-1}
                    onClick={() => setSelected(d.id)}
                    title={`${d.name}: ${RISK_LABEL[risk[d.id].level]}`}
                    className="flex-1 border-r border-white/70 last:border-r-0 hover:opacity-70"
                    style={{ background: RISK_COLOR[risk[d.id].level] }}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[12px] text-muted">
                <span>Most dangerous</span>
                <span>Least dangerous</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {RISK_ORDER.map((l) => (
                <div key={l} className="rounded-md border border-line py-2">
                  <div className="tabular text-[22px] font-semibold leading-none" style={{ color: l === "moderate" ? "var(--risk-moderate-ink)" : RISK_COLOR[l] }}>
                    {counts[l]}
                  </div>
                  <div className="mt-1 text-[12px] text-muted">{RISK_LABEL[l]}</div>
                </div>
              ))}
            </div>

            <h2 className="mt-6 text-[15px] font-semibold">Districts, most to least dangerous</h2>
            <label className="mt-2 block">
              <span className="sr-only">Find a district</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a district"
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[14px] outline-none focus:border-brand focus:bg-surface"
              />
            </label>
            <ol className="mt-2 divide-y divide-line">
              {filtered.map((d) => {
                const r = risk[d.id];
                const rank = ranked.indexOf(d) + 1;
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => setSelected(d.id)}
                      className="grid w-full grid-cols-[1.8rem_1fr_5.5rem] items-center gap-2 py-2 text-left text-[14px] hover:bg-paper"
                    >
                      <span className="tabular text-[13px] text-muted">{rank}</span>
                      <span>
                        <span className="font-medium">{d.name}</span>
                        <span className="text-muted"> · {d.cases7d.toLocaleString()} cases</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper">
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${r.score}%`, background: RISK_COLOR[r.level] }}
                          />
                        </span>
                        <span className="tabular w-6 text-right text-[12px] text-muted">{r.score}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <h2 className="mt-6 text-[15px] font-semibold">What the agents are doing</h2>
            <div className="mt-2">
              <AgentFeed limit={4} />
            </div>
          </div>
        )}
      </aside>

      <section className="relative h-1/2 flex-1 lg:h-auto" aria-label="Dengue risk map">
        <RiskMapClient selectedId={selected} onSelect={setSelected} layers={layers} />

        <div className="absolute left-3 top-3 z-[1000] flex gap-1.5">
          {(
            [
              ["hospitals", "Hospitals"],
              ["pharmacies", "Pharmacies"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              aria-pressed={layers[k]}
              onClick={() => setLayers((l) => ({ ...l, [k]: !l[k] }))}
              className={`rounded-full border px-3 py-1 text-[13px] font-medium shadow-sm ${
                layers[k] ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="absolute bottom-6 left-3 z-[1000] hidden w-44 sm:block rounded-md border border-line bg-surface/95 px-3 py-2.5 shadow-sm">
          <div className="mb-1.5 text-[13px] font-semibold">Dengue risk</div>
          <RiskLegend counts={counts} />
          <div className="mt-2 border-t border-line pt-2 text-[12px] text-muted">
            Prototype · sample data
          </div>
        </div>
      </section>
    </main>
  );
}
