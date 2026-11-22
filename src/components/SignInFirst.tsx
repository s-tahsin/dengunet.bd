import Link from "next/link";

export default function SignInFirst({ what }: { what: string }) {
  return (
    <main className="flex flex-1 items-start justify-center px-5 py-16">
      <div className="max-w-md rounded-lg border border-line bg-surface p-7 text-center">
        <h1 className="text-[22px] font-semibold">Sign in to see {what}</h1>
        <p className="mt-2 text-[14px] text-muted">The map, hospitals and emergency numbers stay open to everyone.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/login" className="rounded-md bg-brand px-4 py-2 text-[15px] font-semibold text-white hover:bg-[#094c38]">
            Sign in
          </Link>
          <Link href="/signup" className="rounded-md border border-line px-4 py-2 text-[15px] font-medium hover:border-ink">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
