import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import GenerationsManager from "@/components/GenerationsManager";

type Generation = {
    id: string;
    user_id: string;
    movie_id: number;
    prompt: string;
    generated_text: string;
    created_at: string;
};

type Movie = {
    id: number;
    title: string | null;
    genre: string | null;
};

export default async function GenerationsPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-white">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">
                        Authentication required
                    </h1>

                    <Link
                        href="/"
                        className="mt-6 inline-block text-cyan-300"
                    >
                        ← Return to login
                    </Link>
                </div>
            </main>
        );
    }

    const { data: adminProfile } = await supabase
        .from("profiles")
        .select("is_superadmin")
        .eq("id", user.id)
        .maybeSingle();

    if (!adminProfile?.is_superadmin) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-white">
                <div className="max-w-md text-center">
                    <div className="text-5xl">🔐</div>

                    <h1 className="mt-5 text-3xl font-bold">
                        Access denied
                    </h1>

                    <p className="mt-4 text-slate-400">
                        This page is available only to super administrators.
                    </p>

                    <div className="mt-7">
                        <SignOutButton />
                    </div>
                </div>
            </main>
        );
    }

    const [generationsResult, moviesResult] =
        await Promise.all([
            supabase
                .from("generations")
                .select(
                    "id, user_id, movie_id, prompt, generated_text, created_at"
                )
                .order("created_at", {
                    ascending: false,
                }),

            supabase
                .from("movies")
                .select("id, title, genre")
                .order("title", {
                    ascending: true,
                }),
        ]);

    const generations =
        (generationsResult.data ?? []) as Generation[];

    const movies =
        (moviesResult.data ?? []) as Movie[];

    return (
        <main className="min-h-screen bg-[#07111f] text-white">
            <header className="border-b border-white/10 bg-[#091522]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-violet-300">
                            AI CINEMA ADMIN
                        </p>

                        <h1 className="mt-1 text-xl font-bold">
                            AI Content Management
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                            Dashboard
                        </Link>

                        <Link
                            href="/users"
                            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                            Users
                        </Link>

                        <Link
                            href="/votes"
                            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                            Votes
                        </Link>

                        <SignOutButton />
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <section className="mb-9">
                    <p className="text-xs font-bold tracking-[0.18em] text-violet-300">
                        AI GENERATED MEDIA
                    </p>

                    <h2 className="mt-3 text-4xl font-bold">
                        Manage Generations
                    </h2>

                    <p className="mt-3 max-w-2xl text-slate-400">
                        Create, review, update, and delete AI-generated movie
                        taglines.
                    </p>
                </section>

                <section className="mb-7 grid gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                        <p className="text-xs text-slate-500">
                            TOTAL CONTENT
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {generations.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-5">
                        <p className="text-xs text-slate-500">
                            CREATE
                        </p>

                        <p className="mt-2 font-bold text-emerald-300">
                            ✓ Enabled
                        </p>
                    </div>

                    <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.035] p-5">
                        <p className="text-xs text-slate-500">
                            UPDATE
                        </p>

                        <p className="mt-2 font-bold text-cyan-300">
                            ✓ Enabled
                        </p>
                    </div>

                    <div className="rounded-2xl border border-red-400/10 bg-red-400/[0.035] p-5">
                        <p className="text-xs text-slate-500">
                            DELETE
                        </p>

                        <p className="mt-2 font-bold text-red-300">
                            ✓ Enabled
                        </p>
                    </div>
                </section>

                {generationsResult.error ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-red-300">
                        {generationsResult.error.message}
                    </div>
                ) : (
                    <GenerationsManager
                        generations={generations}
                        movies={movies}
                        currentUserId={user.id}
                    />
                )}
            </div>
        </main>
    );
}