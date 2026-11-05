"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-white"><section role="alert" className="max-w-lg rounded-2xl border border-red-400/20 bg-red-400/5 p-8"><h1 className="text-2xl font-bold">Unable to load this section</h1><p className="mt-4 text-slate-400">Check your connection and try again. If the problem continues, return to the dashboard and sign in again.</p><div className="mt-6 flex gap-5"><button onClick={reset} className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Try again</button><Link href="/" className="py-2 text-cyan-300">Dashboard</Link></div></section></main>;
}
