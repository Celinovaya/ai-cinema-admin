import Link from "next/link";
import { notFound } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import RecordsManager from "@/components/admin/RecordsManager";
import Week7Navigation from "@/components/admin/Week7Navigation";
import { getAdminAccess } from "@/lib/admin/auth";
import { getSection, type AdminRecord, type ProviderOption } from "@/lib/admin/sections";
import { databaseMessage } from "@/lib/admin/validation";

const PAGE_SIZE = 25;

export default async function AdminSectionPage({ params, searchParams }: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string | string[]; deleted?: string | string[] }>;
}) {
  const section = getSection((await params).section);
  if (!section) notFound();
  const { supabase, allowed, message } = await getAdminAccess();
  if (!allowed) return <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-white"><section className="max-w-lg rounded-3xl border border-amber-400/20 bg-white/[0.04] p-8 text-center"><h1 className="text-3xl font-bold">Administrator access required</h1><p className="my-5 text-slate-400">{message}</p><Link href="/" className="mr-5 text-cyan-300">Return to dashboard / login</Link><SignOutButton /></section></main>;

  const queryParams = await searchParams;
  const requestedPage = Number(queryParams.page ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 1000000 ? requestedPage : 1;
  let query = supabase.from(section.table).select(section.columns.join(","), { count: "exact" }).order(section.order, { ascending: section.order === "chain_id", nullsFirst: false });
  if (section.table === "prompt_chain_steps") query = query.order("step_order", { ascending: true });
  if (section.order !== "id") query = query.order("id", { ascending: true });
  const result = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const providers: ProviderOption[] = [];
  let providerError: string | undefined;
  if (section.table === "llm_models") {
    // Fetch all options in bounded batches, rather than silently truncating at Supabase's row limit.
    for (let offset = 0; ; offset += 500) {
      const batch = await supabase.from("llm_providers").select("id,name").order("name").order("id").range(offset, offset + 499);
      if (batch.error) { providerError = "Unable to load provider choices."; break; }
      providers.push(...(batch.data ?? []));
      if (!batch.data || batch.data.length < 500) break;
    }
  }
  const total = result.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return <main className="min-h-screen bg-[#07111f] text-white">
    <header className="border-b border-white/10 bg-[#091522]"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5"><div><p className="text-xs font-bold tracking-[0.18em] text-cyan-300">AI CINEMA ADMIN</p><h1 className="mt-1 text-xl font-bold">{section.title}</h1></div><div className="flex flex-wrap items-center gap-4"><Link href="/" className="text-sm text-cyan-300">Dashboard</Link><Link href="/users" className="text-sm text-slate-300">Users</Link><Link href="/generations" className="text-sm text-slate-300">Generations</Link><Link href="/votes" className="text-sm text-slate-300">Votes</Link><SignOutButton /></div></div></header>
    <div className="mx-auto max-w-7xl px-6 py-10">
      <details className="mb-8 rounded-xl border border-white/10 p-4"><summary className="cursor-pointer text-sm font-semibold text-cyan-300">Browse Week 7 sections</summary><div className="mt-4"><Week7Navigation compact /></div></details>
      <section className="mb-8"><p className="text-xs font-bold tracking-[0.18em] text-violet-300">WEEK 7 / ADMINISTRATION</p><h2 className="mt-3 text-4xl font-bold">{section.title}</h2><p className="mt-3 text-slate-400">{section.description}</p></section>
      {result.error ? <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-red-200"><p>{databaseMessage(result.error.code)}</p><Link href={`/admin/${section.slug}?page=${page}`} className="mt-4 inline-block underline">Retry loading records</Link></div> : <>
        <RecordsManager key={`${section.slug}-${page}`} section={section} records={(result.data ?? []) as unknown as AdminRecord[]} providers={providers} providerError={providerError} deleted={queryParams.deleted === "1"} />
        <nav aria-label="Record pagination" className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400"><p>{total} records · Page {page} of {pages}</p><div className="flex gap-4">{page > 1 && <Link href={`/admin/${section.slug}?page=${Math.min(page - 1, pages)}`} className="text-cyan-300">← Previous</Link>}{page < pages && <Link href={`/admin/${section.slug}?page=${page + 1}`} className="text-cyan-300">Next →</Link>}{page > pages && <Link href={`/admin/${section.slug}`} className="text-cyan-300">First page</Link>}</div></nav>
      </>}
    </div>
  </main>;
}
