"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Field, inputClass } from "@/components/PageHeader";
import { AuthCard, PORTAL, RolePicker } from "@/components/AuthCard";
import type { Role } from "@/types";

function nameFrom(id: string) {
  const base = id.includes("@") ? id.split("@")[0] : "";
  if (!base) return "Guest";
  return base.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useApp();
  const [role, setRole] = useState<Role>("public");
  const [id, setId] = useState("");

  return (
    <AuthCard title="Sign in to DengueNet BD" intro="You don’t need an account to see the map or call for help.">
      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          signIn({
            name: role === "admin" ? "Admin" : nameFrom(id),
            role,
            districtId: "dhaka",
            hospitalId: role === "hospital" ? "h2" : undefined,
          });
          router.push(PORTAL[role]);
        }}
      >
        <RolePicker value={role} onChange={setRole} />
        <Field label="Email or phone">
          <input
            required
            value={id}
            onChange={(e) => setId(e.target.value)}
            className={inputClass}
            placeholder="01XXXXXXXXX or name@example.com"
          />
        </Field>
        <Field label="Password">
          <input required type="password" className={inputClass} />
        </Field>
        <button className="rounded-md bg-brand px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#094c38]">
          Sign in
        </button>
        <p className="text-[12.5px] text-muted">Prototype: any email and password signs you in.</p>
      </form>
      <p className="mt-5 text-center text-[14px] text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
