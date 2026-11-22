"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import PageHeader, { Field, inputClass } from "@/components/PageHeader";
import { CallRow } from "@/components/DistrictPanel";

const NATIONAL = [
  { phone: "999", name: "National emergency", detail: "Ambulance, police and fire service. Free, 24 hours." },
  { phone: "16263", name: "Shastho Batayon", detail: "Government health helpline. Talk to a doctor about dengue symptoms." },
  { phone: "333", name: "National helpline", detail: "Government information and services." },
];

const WARNING_SIGNS = [
  "Severe stomach pain",
  "Vomiting again and again",
  "Bleeding from gums or nose",
  "Blood in vomit or stool",
  "Fast breathing",
  "Feeling very tired or restless",
];

export default function EmergencyPage() {
  const { districts, ambulances } = useApp();
  const sorted = useMemo(() => [...districts].sort((a, b) => a.name.localeCompare(b.name)), [districts]);
  const [district, setDistrict] = useState("dhaka");
  const local = ambulances.filter((a) => a.district === district);
  const d = districts.find((x) => x.id === district)!;

  return (
    <>
      <PageHeader title="Emergency help">
        Numbers to call for an ambulance or medical advice, anywhere in Bangladesh.
      </PageHeader>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="national">
            <h2 id="national" className="text-[19px] font-semibold">National numbers</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {NATIONAL.map((n, i) => (
                <li key={n.phone}>
                  <a
                    href={`tel:${n.phone}`}
                    className={`flex h-full flex-col rounded-lg border p-4 hover:shadow-sm ${
                      i === 0 ? "border-dot bg-dot text-white" : "border-line bg-surface hover:border-brand"
                    }`}
                  >
                    <span className="tabular text-[34px] font-bold leading-none">{n.phone}</span>
                    <span className="mt-2 font-semibold">{n.name}</span>
                    <span className={`text-[13px] ${i === 0 ? "text-white/85" : "text-muted"}`}>{n.detail}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="amb">
            <h2 id="amb" className="text-[19px] font-semibold">Ambulances near you</h2>
            <div className="mt-3 max-w-sm">
              <Field label="District">
                <select value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass}>
                  {sorted.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <ul className="mt-3 divide-y divide-line border-y border-line bg-surface px-3">
              {local.map((a) => (
                <CallRow
                  key={a.id}
                  name={`${a.name}${a.available24h ? " · 24 hours" : ""}`}
                  phone={a.phone}
                />
              ))}
              <CallRow name={`No answer? Call 999 for the nearest ambulance to ${d.name}`} phone="999" urgent />
            </ul>
          </section>
        </div>

        <aside aria-labelledby="signs" className="self-start rounded-lg border border-line bg-surface p-5">
          <h2 id="signs" className="text-[19px] font-semibold">Go to hospital now if you see</h2>
          <ul className="mt-3 flex flex-col gap-2 text-[15px]">
            {WARNING_SIGNS.map((s) => (
              <li key={s} className="flex gap-2.5">
                <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-dot" />
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-[13px] text-muted">
            These signs often appear when the fever goes down, around day 3 to 7. Keep drinking fluids, and do not take
            painkillers other than paracetamol unless a doctor says so.
          </p>
        </aside>
      </div>
    </>
  );
}
