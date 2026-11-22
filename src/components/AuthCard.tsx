"use client";

import { Logo } from "@/components/TopNav";
import type { Role } from "@/types";

export const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: "public", label: "Public", hint: "Save your district and get alerts" },
  { id: "hospital", label: "Hospital staff", hint: "Update beds and see referrals" },
  { id: "admin", label: "Admin", hint: "Approve agent decisions" },
];

export const PORTAL: Record<Role, string> = { public: "/portal", hospital: "/staff", admin: "/admin" };

export function AuthCard({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-start justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-7">
        <div className="flex items-center gap-2.5">
          <Logo />
          <h1 className="text-[22px] font-semibold">{title}</h1>
        </div>
        <p className="mt-2 text-[14px] text-muted">{intro}</p>
        {children}
      </div>
    </main>
  );
}

export function RolePicker({
  value,
  onChange,
  roles = ROLES,
}: {
  value: Role;
  onChange: (r: Role) => void;
  roles?: typeof ROLES;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[14px] font-medium">I am</legend>
      <div className={`grid gap-2 ${roles.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {roles.map((r) => (
          <label
            key={r.id}
            className={`cursor-pointer rounded-md border px-2.5 py-2 text-[13.5px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
              value === r.id ? "border-brand bg-brand-soft" : "border-line hover:border-ink"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={r.id}
              checked={value === r.id}
              onChange={() => onChange(r.id)}
              className="sr-only"
            />
            <span className="block font-semibold">{r.label}</span>
            <span className="block text-[12px] leading-snug text-muted">{r.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
