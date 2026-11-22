"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { Field, inputClass } from "@/components/PageHeader";
import { AuthCard, PORTAL, ROLES, RolePicker } from "@/components/AuthCard";
import type { Role } from "@/types";

export default function SignupPage() {
  const router = useRouter();
  const { districts, hospitals, signIn } = useApp();
  const sorted = useMemo(() => [...districts].sort((a, b) => a.name.localeCompare(b.name)), [districts]);
  const [role, setRole] = useState<Role>("public");
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("dhaka");
  const [hospital, setHospital] = useState("h2");
  const [error, setError] = useState("");
  const localHospitals = hospitals.filter((h) => h.district === district);

  return (
    <AuthCard
      title="Create your account"
      intro="Pick your district to get alerts when dengue risk goes up there."
    >
      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (String(f.get("password")).length < 8) {
            setError("Password must be at least 8 characters.");
            return;
          }
          if (f.get("password") !== f.get("confirm")) {
            setError("The two passwords don’t match. Type them again.");
            return;
          }
          signIn({
            name: name.trim() || "Guest",
            role,
            districtId: district,
            hospitalId: role === "hospital" ? hospital : undefined,
          });
          router.push(PORTAL[role]);
        }}
      >
        {/* Admin accounts are created by the system admin, not by sign-up */}
        <RolePicker value={role} onChange={setRole} roles={ROLES.filter((r) => r.id !== "admin")} />
        <Field label="Full name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Email or phone">
          <input required className={inputClass} placeholder="01XXXXXXXXX or name@example.com" />
        </Field>
        <Field label="District">
          <select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              const first = hospitals.find((h) => h.district === e.target.value);
              if (first) setHospital(first.id);
            }}
            className={inputClass}
          >
            {sorted.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        {role === "hospital" && (
          <Field label="Your hospital">
            <select value={hospital} onChange={(e) => setHospital(e.target.value)} className={inputClass}>
              {localHospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            <span className="text-[12.5px] text-muted">An admin checks staff accounts before they can update beds.</span>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Password">
            <input required name="password" type="password" className={inputClass} />
          </Field>
          <Field label="Confirm password">
            <input required name="confirm" type="password" className={inputClass} />
          </Field>
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-dot/10 px-3 py-2 text-[13.5px] text-risk-very-high">
            {error}
          </p>
        )}
        <button className="rounded-md bg-brand px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#094c38]">
          Create account
        </button>
      </form>
      <p className="mt-5 text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
