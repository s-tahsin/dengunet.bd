"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { inputClass } from "@/components/PageHeader";
import { RISK_COLOR, RiskBadge } from "@/components/Risk";
import { CallRow } from "@/components/DistrictPanel";
import SignInFirst from "@/components/SignInFirst";
import { RISK_LABEL } from "@/lib/agents/risk";

const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return i === 0 ? "Tmrw" : d.toLocaleDateString("en-GB", { weekday: "short" });
});

export default function PortalPage() {
  const { user, signIn, districts, risk, hospitals, ambulances } = useApp();
  const sorted = useMemo(() => [...districts].sort((a, b) => a.name.localeCompare(b.name)), [districts]);
  const [following, setFollowing] = useState<string[]>(["chattogram", "sylhet"]);
  const [addId, setAddId] = useState("");
  const [channels, setChannels] = useState({ sms: true, email: false, push: true });

  if (!user) return <SignInFirst what="your portal" />;

  const d = districts.find((x) => x.id === user.districtId)!;
  const r = risk[d.id];
  const name = (id: string) => districts.find((x) => x.id === id)?.name ?? id;
  const bedsNear = hospitals
    .filter((h) => h.district === d.id && h.freeBeds > 0)
    .sort((a, b) => b.freeBeds - a.freeBeds)
    .slice(0, 3);
  const amb = ambulances.find((a) => a.district === d.id);

  // Alerts the agents would send this user
  const alerts: { tone: "bad" | "warn" | "info"; text: string }[] = [];
  if (r.level === "very-high" || r.level === "high")
    alerts.push({ tone: "bad", text: `Dengue risk in ${d.name} is ${RISK_LABEL[r.level].toLowerCase()}: ${r.reasons[0]}.` });
  const worse = r.forecast.findIndex((l, i) => i > 0 && l !== r.forecast[i - 1]);
  alerts.push(
    worse === -1
      ? { tone: "info", text: `Risk in ${d.name} is expected to stay ${RISK_LABEL[r.forecast[6]].toLowerCase()} all week.` }
      : { tone: "warn", text: `Risk in ${d.name} is expected to change to ${RISK_LABEL[r.forecast[worse]].toLowerCase()} on ${DAYS[worse]}.` },
  );
  const full = hospitals.filter((h) => h.district === d.id && h.freeBeds === 0);
  if (full.length) alerts.push({ tone: "warn", text: `${full.map((h) => h.name).join(", ")} has no free dengue beds. Check before you go.` });
  alerts.push({ tone: "info", text: "Empty water from pots, tyres and AC trays every 3 days to stop mosquitoes breeding." });
  const toneColor = { bad: "var(--risk-very-high)", warn: "var(--risk-high)", info: "var(--brand)" };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight">Hello, {user.name}</h1>
          <p className="text-[15px] text-muted">Your dengue updates for {d.name}.</p>
        </div>
        <label className="flex items-center gap-2 text-[14px]">
          <span className="whitespace-nowrap font-medium">My district</span>
          <select
            value={user.districtId}
            onChange={(e) => signIn({ ...user, districtId: e.target.value })}
            className={`${inputClass} w-48`}
          >
            {sorted.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="risk" className="rounded-lg border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="risk" className="text-[19px] font-semibold">Risk in {d.name} now</h2>
                <p className="mt-1 text-[14px] text-muted">Score {r.score}/100 · {r.reasons.join(", ")}</p>
              </div>
              <RiskBadge level={r.level} />
            </div>
            <ol className="mt-4 grid grid-cols-7 gap-1.5">
              {r.forecast.map((lvl, i) => (
                <li key={i} className="text-center text-[12px] text-muted">
                  <span className="mb-1 block h-7 rounded-sm" style={{ background: RISK_COLOR[lvl] }} title={RISK_LABEL[lvl]} />
                  {DAYS[i]}
                </li>
              ))}
            </ol>
            <Link href="/" className="mt-3 inline-block text-[14px] font-medium text-brand hover:underline">
              Open the risk map
            </Link>
          </section>

          <section aria-labelledby="alerts">
            <h2 id="alerts" className="text-[19px] font-semibold">Alerts for you</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {alerts.map((a, i) => (
                <li
                  key={i}
                  className="rounded-md bg-surface px-4 py-3 text-[14.5px] shadow-sm"
                  style={{ borderLeft: `4px solid ${toneColor[a.tone]}` }}
                >
                  {a.text}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="follow">
            <h2 id="follow" className="text-[19px] font-semibold">Other districts I follow</h2>
            <p className="text-[13.5px] text-muted">For family in other parts of the country.</p>
            <ul className="mt-3 divide-y divide-line border-y border-line bg-surface">
              {following.map((id) => (
                <li key={id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[14.5px]">
                  <span className="font-medium">{name(id)}</span>
                  <span className="flex items-center gap-3">
                    <RiskBadge level={risk[id].level} size="sm" />
                    <button
                      onClick={() => setFollowing((f) => f.filter((x) => x !== id))}
                      className="text-[13px] text-muted hover:text-ink"
                    >
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (addId && !following.includes(addId) && addId !== user.districtId) setFollowing((f) => [...f, addId]);
                setAddId("");
              }}
            >
              <select value={addId} onChange={(e) => setAddId(e.target.value)} className={`${inputClass} max-w-xs`}>
                <option value="">Choose a district</option>
                {sorted.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <button className="rounded-md border border-line px-4 text-[14px] font-medium hover:border-ink">Follow</button>
            </form>
          </section>
        </div>

        <aside className="flex flex-col gap-6 self-start">
          <section aria-labelledby="help" className="rounded-lg border border-line bg-surface p-5">
            <h2 id="help" className="text-[17px] font-semibold">Need help now?</h2>
            <ul className="mt-1 divide-y divide-line">
              <CallRow name="National emergency" phone="999" urgent />
              <CallRow name="Health helpline" phone="16263" />
              {amb && <CallRow name={amb.name} phone={amb.phone} />}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href={`/hospitals?district=${d.id}`} className="rounded-md bg-brand px-3 py-2 text-center text-[14px] font-semibold text-white hover:bg-[#094c38]">
                Find a hospital
              </Link>
              <Link href={`/medicine?district=${d.id}`} className="rounded-md border border-line px-3 py-2 text-center text-[14px] font-medium hover:border-ink">
                Find medicine
              </Link>
            </div>
          </section>

          <section aria-labelledby="beds">
            <h2 id="beds" className="text-[17px] font-semibold">Free beds near you</h2>
            <ul className="mt-2 divide-y divide-line border-y border-line bg-surface">
              {bedsNear.length === 0 && <li className="px-3 py-3 text-[14px] text-muted">No free dengue beds reported in {d.name}. Use the hospital finder.</li>}
              {bedsNear.map((h) => (
                <li key={h.id} className="flex justify-between gap-3 px-3 py-2.5 text-[14px]">
                  <span className="leading-snug">{h.name}</span>
                  <span className="tabular whitespace-nowrap font-semibold text-risk-low-ink">{h.freeBeds} beds</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="notify">
            <h2 id="notify" className="text-[17px] font-semibold">How should we alert you?</h2>
            <div className="mt-2 flex flex-col gap-2 text-[14.5px]">
              {(
                [
                  ["sms", "SMS"],
                  ["email", "Email"],
                  ["push", "Browser notification"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={channels[k]}
                    onChange={(e) => setChannels((c) => ({ ...c, [k]: e.target.checked }))}
                    className="accent-[var(--brand)]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
