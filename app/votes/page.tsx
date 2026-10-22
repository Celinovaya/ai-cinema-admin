import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

type Vote = {
    id: string;
    user_id: string;
    generation_id: string;
    value: number;
    created_at: string;
};

type Profile = {
    id: string;
    first_name: string | null;
    last_name: string | null;
};

type Generation = {
    id: string;
    movie_id: number;
    generated_text: string;
};

type Movie = {
    id: number;
    title: string | null;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

export default async function VotesPage() {
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

    const [
        votesResult,
        profilesResult,
        generationsResult,
        moviesResult,
    ] = await Promise.all([
        supabase
            .from("votes")
            .select(
                "id, user_id, generation_id, value, created_at"
            )
            .order("created_at", { ascending: false }),

        supabase
            .from("profiles")
            .select("id, first_name, last_name"),

        supabase
            .from("generations")
            .select("id, movie_id, generated_text"),

        supabase
            .from("movies")
            .select("id, title"),
    ]);

    const votes = (votesResult.data ?? []) as Vote[];
    const profiles = (profilesResult.data ?? []) as Profile[];
    const generations =
        (generationsResult.data ?? []) as Generation[];
    const movies = (moviesResult.data ?? []) as Movie[];

    const profileMap = new Map(
        profiles.map((profile) => {
            const name =
                [profile.first_name, profile.last_name]
                    .filter(Boolean)
                    .join(" ") || "Unnamed User";

            return [profile.id, name];
        })
    );

    const generationMap = new Map(
        generations.map((generation) => [
            generation.id,
            generation,
        ])
    );

    const movieMap = new Map(
        movies.map((movie) => [
            movie.id,
            movie.title || "Untitled Movie",
        ])
    );

    const upvotes = votes.filter(
        (vote) => vote.value === 1
    ).length;

    const downvotes = votes.filter(
        (vote) => vote.value === -1
    ).length;

    const approvalRate =
        votes.length > 0
            ? Math.round(
                (upvotes / votes.length) * 100
            )
            : 0;

    return (
        <main className="min-h-screen bg-[#07111f] text-white">
            <header className="border-b border-white/10 bg-[#091522]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-emerald-300">
                            AI CINEMA ADMIN
                        </p>

                        <h1 className="mt-1 text-xl font-bold">
                            Community Feedback
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

                        <SignOutButton />
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10">
                <section className="mb-9">
                    <p className="text-xs font-bold tracking-[0.18em] text-emerald-300">
                        RATINGS / VOTES
                    </p>

                    <h2 className="mt-3 text-4xl font-bold">
                        Community Votes
                    </h2>

                    <p className="mt-3 max-w-2xl text-slate-400">
                        Review how users respond to AI-generated movie
                        taglines and understand overall community sentiment.
                    </p>
                </section>

                <section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                        <p className="text-sm text-slate-500">
                            Total Votes
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {votes.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-6">
                        <p className="text-sm text-slate-500">
                            Upvotes
                        </p>

                        <p className="mt-2 text-3xl font-bold text-emerald-300">
                            {upvotes}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-red-400/10 bg-red-400/[0.035] p-6">
                        <p className="text-sm text-slate-500">
                            Downvotes
                        </p>

                        <p className="mt-2 text-3xl font-bold text-red-300">
                            {downvotes}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-violet-400/10 bg-violet-400/[0.035] p-6">
                        <p className="text-sm text-slate-500">
                            Approval Rate
                        </p>

                        <p className="mt-2 text-3xl font-bold text-violet-300">
                            {approvalRate}%
                        </p>
                    </div>
                </section>

                {votesResult.error ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-red-300">
                        {votesResult.error.message}
                    </div>
                ) : (
                    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
                        <div className="grid grid-cols-[.6fr_1fr_1.3fr_2fr_1fr] gap-4 border-b border-white/10 bg-white/[0.025] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <div>Rating</div>
                            <div>User</div>
                            <div>Movie</div>
                            <div>AI Tagline</div>
                            <div>Date</div>
                        </div>

                        <div className="divide-y divide-white/10">
                            {votes.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">
                                    No votes have been submitted yet.
                                </div>
                            ) : (
                                votes.map((vote) => {
                                    const generation =
                                        generationMap.get(
                                            vote.generation_id
                                        );

                                    const movieTitle =
                                        generation
                                            ? movieMap.get(
                                                generation.movie_id
                                            ) ||
                                            `Movie #${generation.movie_id}`
                                            : "Unknown Movie";

                                    const userName =
                                        profileMap.get(
                                            vote.user_id
                                        ) || "Unknown User";

                                    return (
                                        <div
                                            key={vote.id}
                                            className="grid grid-cols-[.6fr_1fr_1.3fr_2fr_1fr] gap-4 px-6 py-5 transition hover:bg-white/[0.025]"
                                        >
                                            <div className="flex items-center">
                                                {vote.value === 1 ? (
                                                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                                                        👍 UP
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-300">
                                                        👎 DOWN
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center">
                                                <div>
                                                    <p className="text-sm font-semibold">
                                                        {userName}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-600">
                                                        User
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center text-sm font-semibold text-cyan-300">
                                                {movieTitle}
                                            </div>

                                            <div className="flex items-center">
                                                <p className="line-clamp-2 text-sm leading-6 text-slate-300">
                                                    {generation?.generated_text
                                                        ? `“${generation.generated_text}”`
                                                        : "Generation unavailable"}
                                                </p>
                                            </div>

                                            <div className="flex items-center text-xs leading-5 text-slate-500">
                                                {formatDate(
                                                    vote.created_at
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                )}

                <section className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/[0.06] to-violet-500/[0.05] p-6">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-xs font-bold tracking-[0.15em] text-emerald-300">
                                COMMUNITY SENTIMENT
                            </p>

                            <p className="mt-2 text-lg font-semibold">
                                {approvalRate >= 70
                                    ? "Most users are responding positively to AI-generated content."
                                    : approvalRate >= 50
                                        ? "Community feedback is mixed but generally positive."
                                        : "AI-generated content may need further iteration."}
                            </p>
                        </div>

                        <div className="shrink-0 text-right">
                            <p className="text-4xl font-bold text-emerald-300">
                                {approvalRate}%
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                positive rating
                            </p>
                        </div>
                    </div>
                </section>

                <div className="mt-6 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-4 text-sm text-slate-400">
                    📊 Votes are read-only in the admin interface. This page
                    provides visibility into community ratings without
                    modifying user feedback.
                </div>
            </div>
        </main>
    );
}