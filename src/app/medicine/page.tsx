"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import PageHeader, { Field, inputClass } from "@/components/PageHeader";
import { findShortages, LOW_STOCK, MEDICINE_LABEL } from "@/lib/agents/supply";
import type { Medicine } from "@/types";

const MEDS = Object.keys(MEDICINE_LABEL) as Medicine[];

function StockCell({ qty }: { qty: number }) {
  const state = qty === 0 ? "out" : qty < LOW_STOCK ? "low" : "in";
  const style = {
    in: "text-risk-low-ink",
    low: "text-risk-high-ink",
    out: "text-risk-very-high",
  }[state];
  return (
    <td className={`tabular px-3 py-2.5 text-[14px] font-medium ${style}`}>
      {state === "out" ? "Out" : state === "low" ? `Low · ${qty}` : `In stock · ${qty}`}
    </td>
  );
}

function MedicineInner() {
  const params = useSearchParams();
  const { districts, pharmacies, risk } = useApp();
  const sorted = useMemo(() => [...districts].sort((a, b) => a.name.localeCompare(b.name)), [districts]);
  const [district, setDistrict] = useState(params.get("district") ?? "dhaka");
  const [need, setNeed] = useState<Medicine | "all">("all");
  const [open24, setOpen24] = useState(false);

  const list = pharmacies
    .filter((p) => p.district === district)
    .filter((p) => (need === "all" ? true : p.stock[need] > 0))
    .filter((p) => (open24 ? p.open24h : true));

  const alerts = useMemo(() => findShortages(districts, pharmacies, risk), [districts, pharmacies, risk]);
  const name = (id: string) => districts.find((d) => d.id === id)?.name ?? id;

  return (
    <>
      <PageHeader title="Medicine">
        Where to find saline, ORS, paracetamol and dengue test kits. Pharmacies and hospitals update their stock here.
      </PageHeader>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-6 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="ph">
          <h2 id="ph" className="sr-only">Pharmacies</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="District">
              <select value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass}>
                {sorted.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="I need">
              <select value={need} onChange={(e) => setNeed(e.target.value as Medicine | "all")} className={inputClass}>
                <option value="all">Any medicine</option>
                {MEDS.map((m) => (
                  <option key={m} value={m}>
                    {MEDICINE_LABEL[m]}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 pb-2 text-[14px]">
              <input type="checkbox" checked={open24} onChange={(e) => setOpen24(e.target.checked)} className="accent-[var(--brand)]" />
              Open 24 hours
            </label>
          </div>

          <div className="mt-4 overflow-x-auto border-y border-line bg-surface">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-[13px] text-muted">
                  <th className="px-3 py-2 font-medium">Pharmacy</th>
                  {MEDS.map((m) => (
                    <th key={m} className={`px-3 py-2 font-medium ${need === m ? "text-ink" : ""}`}>
                      {MEDICINE_LABEL[m]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2.5">
                      <div className="font-medium leading-snug">{p.name}</div>
                      <div className="text-[12.5px] text-muted">
                        {p.area}
                        {p.open24h ? " · open 24 hours" : ""} ·{" "}
                        <a href={`tel:${p.phone}`} className="text-brand">
                          {p.phone}
                        </a>
                      </div>
                    </td>
                    {MEDS.map((m) => (
                      <StockCell key={m} qty={p.stock[m]} />
                    ))}
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-[14px] text-muted">
                      No pharmacy in {name(district)} matches. Try another medicine, or ask at the district hospital.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside aria-labelledby="short" className="self-start">
          <h2 id="short" className="text-[19px] font-semibold">Shortages the supply agent found</h2>
          <p className="mt-1 text-[13.5px] text-muted">High-risk districts where most pharmacies are low on something.</p>
          <ul className="mt-3 flex flex-col gap-2">
            {alerts.slice(0, 6).map((a) => (
              <li key={a.id} className="rounded-md border-l-4 border-[#6b4fa1] bg-surface px-3 py-2.5 text-[14px] shadow-sm">
                <div className="font-semibold">
                  {MEDICINE_LABEL[a.medicine]} in {name(a.districtId)}
                </div>
                <div className="text-[13px] text-muted">
                  {a.pharmaciesShort} of {a.pharmaciesTotal} pharmacies low or out.
                  {a.fromDistrictId && ` Suggest sending ${a.units} units from ${name(a.fromDistrictId)}.`}
                </div>
              </li>
            ))}
            {alerts.length === 0 && <li className="text-[14px] text-muted">No shortages right now.</li>}
          </ul>
        </aside>
      </div>
    </>
  );
}

export default function MedicinePage() {
  return (
    <Suspense>
      <MedicineInner />
    </Suspense>
  );
}
