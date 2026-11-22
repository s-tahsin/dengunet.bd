"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { RISK_LABEL } from "@/lib/agents/risk";
import { LOW_STOCK, MEDICINE_LABEL } from "@/lib/agents/supply";
import { RISK_COLOR, RiskBadge } from "@/components/Risk";
import type { Medicine } from "@/types";

const DAYS = Array.from({ length: 7 }, (_, i) => {
  if (i === 0) return "Tmrw";
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return d.toLocaleDateString("en-GB", { weekday: "short" });
});

export default function DistrictPanel({ id, onBack }: { id: string; onBack: () => void }) {
  const { districts, risk, hospitals, ambulances, pharmacies } = useApp();
  const d = districts.find((x) => x.id === id)!;
  const r = risk[id];

  const localHospitals = useMemo(
    () => hospitals.filter((h) => h.district === id).sort((a, b) => b.freeBeds - a.freeBeds),
    [hospitals, id],
  );
  const localAmb = ambulances.filter((a) => a.district === id);
  const localPh = pharmacies.filter((p) => p.district === id);
  const change = Math.round((r.growth - 1) * 100);
  const bedShare = d.freeBeds / Math.max(d.dengueBeds, 1);

  return (
    <div className="flex flex-col">
      <button onClick={onBack} className="self-start text-[14px] font-medium text-brand hover:underline">
        ← All districts
      </button>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight">{d.name}</h1>
          <p className="text-[14px] text-muted">{d.division} division</p>
        </div>
        <RiskBadge level={r.level} />
      </div>

      <p className="mt-3 rounded-md bg-paper px-3 py-2 text-[14px] leading-snug">
        <span className="font-semibold">Risk agent:</span> score {r.score}/100 because of {r.reasons.join(", ")}.
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        <Stat label="Cases, 7 days" value={d.cases7d.toLocaleString()} />
        <Stat
          label="vs last week"
          value={`${change >= 0 ? "+" : ""}${change}%`}
          tone={change > 20 ? "bad" : change < 0 ? "good" : undefined}
        />
        <Stat
          label="Beds free"
          value={`${d.freeBeds}/${d.dengueBeds}`}
          tone={bedShare < 0.1 ? "bad" : bedShare > 0.3 ? "good" : undefined}
        />
      </dl>

      <section className="mt-5">
        <h2 className="text-[15px] font-semibold">Next 7 days</h2>
        <ol className="mt-2 grid grid-cols-7 gap-1">
          {r.forecast.map((lvl, i) => (
            <li key={i} className="text-center text-[11.5px] text-muted">
              <span
                className="mb-1 block h-6 rounded-sm"
                style={{ background: RISK_COLOR[lvl] }}
                title={RISK_LABEL[lvl]}
              />
              {DAYS[i]}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold">Hospitals</h2>
          <Link href={`/hospitals?district=${id}`} className="text-[13px] font-medium text-brand hover:underline">
            Find the best hospital
          </Link>
        </div>
        <ul className="mt-1 divide-y divide-line">
          {localHospitals.slice(0, 4).map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 py-2 text-[14px]">
              <span className="leading-snug">{h.name}</span>
              <span
                className={`tabular whitespace-nowrap font-semibold ${
                  h.freeBeds === 0 ? "text-risk-very-high" : h.freeBeds < 10 ? "text-risk-high-ink" : "text-risk-low-ink"
                }`}
              >
                {h.freeBeds === 0 ? "Full" : `${h.freeBeds} beds`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h2 className="text-[15px] font-semibold">Call for help</h2>
        <ul className="mt-1 divide-y divide-line">
          <CallRow name="National emergency (police, fire, ambulance)" phone="999" urgent />
          <CallRow name="Shastho Batayon health helpline" phone="16263" />
          {localAmb.map((a) => (
            <CallRow key={a.id} name={a.name} phone={a.phone} />
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold">Medicine in {d.name}</h2>
          <Link href={`/medicine?district=${id}`} className="text-[13px] font-medium text-brand hover:underline">
            See pharmacies
          </Link>
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {(Object.keys(MEDICINE_LABEL) as Medicine[]).map((m) => {
            const have = localPh.filter((p) => p.stock[m] >= LOW_STOCK).length;
            return (
              <li key={m} className="rounded-md border border-line px-3 py-2 text-[13px]">
                <div className="font-medium">{MEDICINE_LABEL[m]}</div>
                <div className={have === 0 ? "text-risk-very-high" : "text-muted"}>
                  {have === 0 ? "Not available nearby" : `In stock at ${have} of ${localPh.length}`}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="bg-surface px-2 py-2.5">
      <dd
        className={`tabular text-[20px] font-semibold leading-tight ${
          tone === "bad" ? "text-risk-very-high" : tone === "good" ? "text-risk-low-ink" : ""
        }`}
      >
        {value}
      </dd>
      <dt className="text-[12px] text-muted">{label}</dt>
    </div>
  );
}

export function CallRow({ name, phone, urgent }: { name: string; phone: string; urgent?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 text-[14px]">
      <span className="leading-snug">{name}</span>
      <a
        href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
        className={`tabular whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] font-semibold ${
          urgent ? "bg-dot text-white hover:bg-[#b51f33]" : "border border-line text-ink hover:border-brand hover:text-brand"
        }`}
      >
        Call {phone}
      </a>
    </li>
  );
}
