export default function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <h1 className="text-[28px] font-semibold leading-tight">{title}</h1>
        {children && <p className="mt-1 max-w-2xl text-[15px] text-muted">{children}</p>}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[14px]">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-brand";
