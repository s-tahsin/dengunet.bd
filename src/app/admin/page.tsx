"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import PageHeader, { Field, inputClass } from "@/components/PageHeader";
import AgentFeed, { AGENT_COLOR } from "@/components/AgentFeed";
import { RiskBadge } from "@/components/Risk";
import { CasesByDivision, RiskByDivision } from "@/components/Charts";
import SignInFirst from "@/components/SignInFirst";

export default function AdminPage() {
  const { user, draft: districts, draftRisk: risk, plan, simulateOutbreak, decide, resetData } = useApp();
  const sorted = useMemo(() => [...districts].sort((a, b) => a.name.localeCompare(b.name)), [districts]);
  const [target, setTarget] = useState("sylhet");
  const [multiplier, setMultiplier] = useState(3);
  const [rain, setRain] = useState(160);
  const [ranFor, setRanFor] = useState<string | null>(null);

  if (!user || user.role !== "admin") return <SignInFirst what="the admin portal" />;

  const t = districts.find((d) => d.id === target)!;
  const pending = plan.filter((a) => a.status === "pending").length;
  const published = plan.some((a) => a.agent === "Risk" && a.status === "approved");

  return (
    <>
      <PageHeader title="Admin">
        Test how the agents react to an outbreak, then approve or override what they suggest. Nothing changes on the
        public map until an admin approves it.
      </PageHeader>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="sim" className="rounded-lg border border-line bg-surface p-5">
            <h2 id="sim" className="text-[19px] font-semibold">Simulate an outbreak</h2>
            <form
              className="mt-4 grid gap-5 sm:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                simulateOutbreak(target, multiplier, rain);
                setRanFor(target);
              }}
            >
              <Field label="District">
                <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
                  {sorted.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <span className="mt-1 flex items-center gap-2 text-[12.5px] text-muted">
                  Now <RiskBadge level={risk[target].level} size="sm" /> {t.cases7d.toLocaleString()} cases
                </span>
              </Field>
              <Field label={`Cases grow ${multiplier}×`}>
                <input
                  type="range"
                  min={1.5}
                  max={6}
                  step={0.5}
                  value={multiplier}
                  onChange={(e) => setMultiplier(Number(e.target.value))}
                  className="accent-[var(--brand)]"
                />
                <span className="text-[12.5px] text-muted">
                  {t.cases7d.toLocaleString()} → {Math.round(t.cases7d * multiplier).toLocaleString()} cases a week
                </span>
              </Field>
              <Field label={`Rainfall ${rain} mm this week`}>
                <input
                  type="range"
                  min={0}
                  max={250}
                  step={10}
                  value={rain}
                  onChange={(e) => setRain(Number(e.target.value))}
                  className="accent-[var(--brand)]"
                />
                <span className="text-[12.5px] text-muted">Heavy rain means more breeding sites</span>
              </Field>
              <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
                <button className="rounded-md bg-brand px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#094c38]">
                  Run the agents
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetData();
                    setRanFor(null);
                  }}
                  className="rounded-md border border-line px-4 py-2.5 text-[15px] font-medium hover:border-ink"
                >
                  Reset sample data
                </button>
                {ranFor && published && (
                  <Link href="/" className="text-[14px] font-medium text-brand hover:underline">
                    See the new colours on the map
                  </Link>
                )}
                {ranFor && !published && plan.length > 0 && (
                  <span className="text-[14px] text-muted">Approve the risk change below to update the public map.</span>
                )}
              </div>
            </form>
          </section>

          <section aria-labelledby="plan">
            <div className="flex items-baseline justify-between">
              <h2 id="plan" className="text-[19px] font-semibold">Coordinator plan</h2>
              {plan.length > 0 && <span className="text-[13px] text-muted">{pending} waiting for you</span>}
            </div>
            {plan.length === 0 ? (
              <p className="mt-2 rounded-md border border-dashed border-line px-4 py-6 text-[14px] text-muted">
                Run a simulation and the coordinator agent will collect suggestions from the risk, hospital and supply
                agents here.
              </p>
            ) : (
              <ol className="mt-3 flex flex-col gap-2">
                {plan.map((a) => (
                  <li
                    key={a.id}
                    className="grid gap-3 rounded-md border border-line bg-surface p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    style={{ borderLeft: `4px solid ${AGENT_COLOR[a.agent]}` }}
                  >
                    <div>
                      <div className="text-[12.5px] font-semibold" style={{ color: AGENT_COLOR[a.agent] }}>
                        {a.agent} agent
                      </div>
                      <div className="font-medium leading-snug">{a.title}</div>
                      <div className="text-[13px] text-muted">Why: {a.reason}</div>
                    </div>
                    {a.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => decide(a.id, "approved")}
                          className="rounded-md bg-brand px-3 py-1.5 text-[14px] font-semibold text-white hover:bg-[#094c38]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => decide(a.id, "overridden")}
                          className="rounded-md border border-line px-3 py-1.5 text-[14px] font-medium hover:border-ink"
                        >
                          Override
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`justify-self-start rounded-full px-2.5 py-0.5 text-[13px] font-semibold sm:justify-self-end ${
                          a.status === "approved" ? "bg-brand-soft text-brand" : "bg-paper text-muted"
                        }`}
                      >
                        {a.status === "approved" ? "Approved" : "Overridden"}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-label="Analytics" className="grid gap-6 rounded-lg border border-line bg-surface p-5 md:grid-cols-2">
            <CasesByDivision />
            <RiskByDivision />
          </section>
        </div>

        <aside aria-labelledby="log" className="self-start lg:sticky lg:top-20">
          <h2 id="log" className="text-[19px] font-semibold">Agent activity</h2>
          <p className="mb-3 text-[13px] text-muted">Every suggestion and every admin decision is logged.</p>
          <AgentFeed limit={14} />
        </aside>
      </div>
    </>
  );
}
