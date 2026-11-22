"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import PageHeader, { Field, inputClass } from "@/components/PageHeader";
import { RiskBadge } from "@/components/Risk";
import { recommendHospitals, type HospitalChoice, type Severity } from "@/lib/agents/hospital";

const SEVERITY: { value: Severity; label: string; hint: string }[] = [
  { value: "mild", label: "Fever, no warning signs", hint: "Can drink fluids, no bleeding" },
  { value: "warning-signs", label: "Warning signs", hint: "Stomach pain, vomiting, bleeding gums, very tired" },
  { value: "severe", label: "Severe", hint: "Fainting, heavy bleeding, breathing trouble" },
];

function HospitalsInner() {
  const params = useSearchParams();
  const { districts, hospitals, risk } = useApp();
  const sortedDistricts = useMemo(() => [...districts].sort((a, b) => a.name.localeCompare(b.name)), [districts]);
  const divisions = useMemo(() => [...new Set(districts.map((d) => d.division))].sort(), [districts]);

  // Recommender
  const [from, setFrom] = useState(params.get("district") ?? "dhaka");
  const [severity, setSeverity] = useState<Severity>("warning-signs");
  const [needsIcu, setNeedsIcu] = useState(false);
  const [result, setResult] = useState<HospitalChoice[] | null>(null);

  // Directory filters
  const [division, setDivision] = useState("all");
  const [district, setDistrict] = useState(params.get("district") ?? "all");
  const [onlyFree, setOnlyFree] = useState(false);

  const list = hospitals
    .filter((h) => (district === "all" ? true : h.district === district))
    .filter((h) => (division === "all" ? true : districts.find((d) => d.id === h.district)?.division === division))
    .filter((h) => (onlyFree ? h.freeBeds > 0 : true))
    .sort((a, b) => b.freeBeds - a.freeBeds);

  const name = (id: string) => districts.find((d) => d.id === id)?.name ?? id;

  return (
    <>
      <PageHeader title="Hospitals">
        Free dengue beds and ICU space across the country. Describe the patient and the hospital agent suggests where to go.
      </PageHeader>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-6 lg:grid-cols-[380px_1fr]">
        <section aria-labelledby="rec" className="self-start rounded-lg border-2 border-brand bg-surface p-5 lg:sticky lg:top-20">
          <h2 id="rec" className="text-[19px] font-semibold">Find the right hospital</h2>
          <p className="mt-1 text-[13.5px] text-muted">
            Ranks hospitals by free beds, ICU space, distance and how crowded they are.
          </p>
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setResult(recommendHospitals({ districtId: from, severity, needsIcu }, districts, hospitals));
            }}
          >
            <Field label="Patient is in">
              <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass}>
                {sortedDistricts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-[14px] font-medium">How unwell?</legend>
              {SEVERITY.map((s) => (
                <label
                  key={s.value}
                  className={`flex cursor-pointer gap-2.5 rounded-md border px-3 py-2 text-[14px] ${
                    severity === s.value ? "border-brand bg-brand-soft" : "border-line"
                  }`}
                >
                  <input
                    type="radio"
                    name="severity"
                    value={s.value}
                    checked={severity === s.value}
                    onChange={() => setSeverity(s.value)}
                    className="mt-1 accent-[var(--brand)]"
                  />
                  <span>
                    <span className="block font-medium">{s.label}</span>
                    <span className="block text-[12.5px] text-muted">{s.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" checked={needsIcu} onChange={(e) => setNeedsIcu(e.target.checked)} className="accent-[var(--brand)]" />
              Doctor says the patient needs an ICU bed
            </label>
            <button className="rounded-md bg-brand px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#094c38]">
              Suggest hospitals
            </button>
          </form>

          {result && (
            <div className="mt-5 border-t border-line pt-4" aria-live="polite">
              {result.length === 0 ? (
                <p className="text-[14px]">
                  No hospital nearby has space for this patient. Call <a href="tel:999" className="font-semibold text-dot">999</a> for an ambulance to the nearest large hospital.
                </p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {result.map((c, i) => (
                    <li key={c.hospital.id} className={i === 0 ? "rounded-md bg-brand-soft p-3" : "px-3"}>
                      <div className="text-[12.5px] font-medium text-muted">{i === 0 ? "Best choice" : `Backup ${i}`}</div>
                      <div className="font-semibold leading-snug">{c.hospital.name}</div>
                      <div className="text-[13px] text-muted">{c.reasons.join(" · ")}</div>
                      <a href={`tel:${c.hospital.phone}`} className="mt-1 inline-block text-[13px] font-semibold text-brand">
                        Call {c.hospital.phone}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="dir">
          <h2 id="dir" className="text-[19px] font-semibold">All hospitals</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Division">
              <select value={division} onChange={(e) => { setDivision(e.target.value); setDistrict("all"); }} className={inputClass}>
                <option value="all">All divisions</option>
                {divisions.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="District">
              <select value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass}>
                <option value="all">All districts</option>
                {sortedDistricts
                  .filter((d) => division === "all" || d.division === division)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 pb-2 text-[14px]">
              <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} className="accent-[var(--brand)]" />
              Only with free beds
            </label>
          </div>

          <p className="mt-4 text-[13px] text-muted">{list.length} hospitals</p>
          <ul className="mt-1 divide-y divide-line border-y border-line bg-surface">
            {list.map((h) => {
              const share = h.freeBeds / Math.max(h.dengueBeds, 1);
              return (
                <li key={h.id} className="grid gap-2 px-3 py-3 sm:grid-cols-[1fr_190px_auto] sm:items-center">
                  <div>
                    <div className="font-medium leading-snug">{h.name}</div>
                    <div className="flex items-center gap-2 text-[13px] text-muted">
                      {name(h.district)} · {h.type}
                      <RiskBadge level={risk[h.district].level} size="sm" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[13px]">
                      <span className={h.freeBeds === 0 ? "font-semibold text-risk-very-high" : ""}>
                        {h.freeBeds === 0 ? "Full" : `${h.freeBeds} beds free`}
                      </span>
                      <span className="tabular text-muted">of {h.dengueBeds}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(2, (1 - share) * 100)}%`,
                          background: share < 0.08 ? "var(--risk-very-high)" : share < 0.2 ? "var(--risk-high)" : "var(--risk-low)",
                        }}
                      />
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      {h.icuBeds > 0 ? `ICU ${h.icuFree} of ${h.icuBeds} free` : "No ICU"}
                    </div>
                  </div>
                  <a
                    href={`tel:${h.phone}`}
                    className="tabular justify-self-start whitespace-nowrap rounded-md border border-line px-2.5 py-1 text-[13px] font-semibold hover:border-brand hover:text-brand sm:justify-self-end"
                  >
                    Call
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}

export default function HospitalsPage() {
  return (
    <Suspense>
      <HospitalsInner />
    </Suspense>
  );
}
