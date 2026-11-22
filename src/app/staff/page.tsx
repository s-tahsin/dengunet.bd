"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { RiskBadge } from "@/components/Risk";
import SignInFirst from "@/components/SignInFirst";
import AgentFeed from "@/components/AgentFeed";

// Sample referrals the hospital agent would send this hospital (no personal data).
const REFERRALS = [
  { id: "r1", from: "Mirpur", severity: "Warning signs", note: "Fever day 4, stomach pain", eta: "20 min" },
  { id: "r2", from: "Jatrabari", severity: "Severe", note: "Bleeding gums, very tired; needs ICU check", eta: "35 min" },
  { id: "r3", from: "Badda", severity: "Warning signs", note: "Vomiting, can’t keep fluids down", eta: "15 min" },
];

function Stepper({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  const set = (v: number) => onChange(Math.max(0, Math.min(max, v)));
  return (
    <div>
      <div className="text-[14px] font-medium">{label}</div>
      <div className="mt-1.5 flex items-center gap-2">
        <button type="button" onClick={() => set(value - 1)} aria-label={`One fewer: ${label}`} className="h-10 w-10 rounded-md border border-line text-[20px] hover:border-ink">
          −
        </button>
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => set(Number(e.target.value))}
          aria-label={label}
          className="tabular h-10 w-20 rounded-md border border-line text-center text-[18px] font-semibold outline-none focus:border-brand"
        />
        <button type="button" onClick={() => set(value + 1)} aria-label={`One more: ${label}`} className="h-10 w-10 rounded-md border border-line text-[20px] hover:border-ink">
          +
        </button>
        <span className="text-[14px] text-muted">of {max}</span>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const { user, hospitals, districts, risk, updateHospital } = useApp();
  const h = hospitals.find((x) => x.id === (user?.hospitalId ?? "h2"))!;
  const [beds, setBeds] = useState(h.freeBeds);
  const [icu, setIcu] = useState(h.icuFree);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, "accepted" | "declined">>({});

  if (!user || user.role !== "hospital") return <SignInFirst what="the hospital staff portal" />;

  const d = districts.find((x) => x.id === h.district)!;
  const changed = beds !== h.freeBeds || icu !== h.icuFree;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-[14px] font-medium text-brand">Hospital staff portal</p>
          <h1 className="text-[28px] font-semibold leading-tight">{h.name}</h1>
          <p className="flex items-center gap-2 text-[15px] text-muted">
            {d.name} · signed in as {user.name} <RiskBadge level={risk[d.id].level} size="sm" />
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="beds" className="rounded-lg border border-line bg-surface p-5">
            <h2 id="beds" className="text-[19px] font-semibold">Update free beds</h2>
            <p className="mt-1 text-[14px] text-muted">
              The public map and the hospital agent use these numbers. Update them at least twice a day.
            </p>
            <form
              className="mt-4 flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                updateHospital(h.id, beds, icu);
                setSavedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
              }}
            >
              <div className="flex flex-wrap gap-8">
                <Stepper label="Free dengue beds" value={beds} max={h.dengueBeds} onChange={setBeds} />
                {h.icuBeds > 0 && <Stepper label="Free ICU beds" value={icu} max={h.icuBeds} onChange={setIcu} />}
              </div>
              <div className="flex items-center gap-3">
                <button
                  disabled={!changed}
                  className="rounded-md bg-brand px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#094c38] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save bed numbers
                </button>
                <span role="status" className="text-[14px] text-muted">
                  {changed ? "Not saved yet" : savedAt ? `Saved at ${savedAt}` : "Up to date"}
                </span>
              </div>
            </form>
          </section>

          <section aria-labelledby="ref">
            <h2 id="ref" className="text-[19px] font-semibold">Patients the hospital agent is sending you</h2>
            <p className="mt-1 text-[14px] text-muted">Accept if you can take them. If not, the agent suggests the next hospital.</p>
            <ul className="mt-3 flex flex-col gap-2">
              {REFERRALS.map((p) => {
                const dec = decisions[p.id];
                return (
                  <li key={p.id} className="grid gap-3 rounded-md border border-line bg-surface p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <div className="font-medium">
                        From {p.from} · <span className={p.severity === "Severe" ? "text-risk-very-high" : "text-risk-high-ink"}>{p.severity}</span>
                      </div>
                      <div className="text-[13.5px] text-muted">
                        {p.note} · arriving in about {p.eta}
                      </div>
                    </div>
                    {dec ? (
                      <span className={`justify-self-start rounded-full px-2.5 py-0.5 text-[13px] font-semibold sm:justify-self-end ${dec === "accepted" ? "bg-brand-soft text-brand" : "bg-paper text-muted"}`}>
                        {dec === "accepted" ? "Accepted" : "Sent to next hospital"}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => setDecisions((x) => ({ ...x, [p.id]: "accepted" }))} className="rounded-md bg-brand px-3 py-1.5 text-[14px] font-semibold text-white hover:bg-[#094c38]">
                          Accept
                        </button>
                        <button onClick={() => setDecisions((x) => ({ ...x, [p.id]: "declined" }))} className="rounded-md border border-line px-3 py-1.5 text-[14px] font-medium hover:border-ink">
                          Can’t take
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-6 self-start">
          <section aria-labelledby="today" className="rounded-lg border border-line bg-surface p-5">
            <h2 id="today" className="text-[17px] font-semibold">{d.name} today</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-[14px]">
              <div>
                <dt className="text-muted">Cases, 7 days</dt>
                <dd className="tabular text-[22px] font-semibold">{d.cases7d.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted">District beds free</dt>
                <dd className="tabular text-[22px] font-semibold">
                  {d.freeBeds}/{d.dengueBeds}
                </dd>
              </div>
            </dl>
          </section>
          <section aria-labelledby="log">
            <h2 id="log" className="text-[17px] font-semibold">Recent activity</h2>
            <div className="mt-2">
              <AgentFeed limit={5} />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
