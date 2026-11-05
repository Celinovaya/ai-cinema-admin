import Link from "next/link";
import { sections } from "@/lib/admin/sections";

export default function Week7Navigation({ compact = false }: { compact?: boolean }) {
  return <nav aria-label="Week 7 administration" className="mb-8">
    {!compact && <div className="mb-5"><p className="text-xs font-bold tracking-[0.18em] text-violet-300">WEEK 7</p><h2 className="mt-2 text-2xl font-bold">AI Operations &amp; Access</h2></div>}
    <div className={compact ? "flex flex-wrap gap-2" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
      {sections.map((section) => <Link key={section.slug} href={`/admin/${section.slug}`} className={compact ? "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200" : "rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]"}>
        <span className="font-semibold">{section.title}</span>
        {!compact && <><p className="mt-2 text-sm leading-6 text-slate-400">{section.description}</p><p className="mt-3 text-xs font-semibold text-cyan-300">{section.mode === "read" ? "View records" : section.mode === "update" ? "View & update" : "Create, view, edit & delete"} →</p></>}
      </Link>)}
    </div>
  </nav>;
}
