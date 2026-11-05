import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import SignOutButton from "@/components/SignOutButton";
import Week7Navigation from "@/components/admin/Week7Navigation";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
  is_superadmin: boolean;
};

type Generation = {
  id: string;
  movie_id: number;
  prompt: string;
  generated_text: string;
  created_at: string;
};

type Vote = {
  id: string;
  value: number;
  created_at: string;
};

type Movie = {
  id: number;
  title: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return (
        <main className="min-h-screen bg-[#07111f] text-white">
          <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-16">
            <div className="grid w-full gap-16 lg:grid-cols-2 lg:items-center">
              <section>
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs font-bold tracking-[0.18em] text-cyan-300">
                  AI CINEMA
                  <span className="text-slate-500">/</span>
                  ADMIN
                </div>

                <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                  Manage the
                  <span className="block bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                                    AI movie experience.
                                </span>
                </h1>

                <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
                  A secure admin workspace for monitoring users,
                  managing AI-generated taglines, and understanding
                  how the community votes.
                </p>

                <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xl">👥</div>
                    <p className="mt-3 text-sm font-semibold">
                      Users
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xl">✦</div>
                    <p className="mt-3 text-sm font-semibold">
                      AI Media
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xl">👍</div>
                    <p className="mt-3 text-sm font-semibold">
                      Votes
                    </p>
                  </div>
                </div>
              </section>

              <section className="mx-auto w-full max-w-md">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30">
                  <div className="mb-8">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-xl text-violet-300">
                      ✦
                    </div>

                    <p className="text-xs font-bold tracking-[0.18em] text-violet-300">
                      ADMIN ACCESS
                    </p>

                    <h2 className="mt-3 text-2xl font-bold">
                      Sign in to continue
                    </h2>

                    <p className="mt-3 leading-6 text-slate-400">
                      Access is limited to authorized
                      administrators.
                    </p>
                  </div>

                  <GoogleLoginButton />

                  <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                    <span>🔒</span>
                    <span>
                                        Protected by Google authentication and
                                        admin authorization.
                                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
    );
  }

  const { data: profile, error: profileError } =
      await supabase
          .from("profiles")
          .select(
              "id, first_name, last_name, created_at, is_superadmin"
          )
          .eq("id", user.id)
          .maybeSingle();

  if (profileError) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-white">
          <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-red-400/5 p-8">
            <p className="text-sm font-bold tracking-widest text-red-300">
              DATABASE ERROR
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Unable to verify admin access.
            </h1>

            <p className="mt-4 text-slate-400">
              {profileError.message}
            </p>

            <div className="mt-7">
              <SignOutButton />
            </div>
          </div>
        </main>
    );
  }

  if (!profile?.is_superadmin) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-white">
          <div className="w-full max-w-lg rounded-3xl border border-amber-400/20 bg-white/[0.04] p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-3xl">
              🔐
            </div>

            <p className="mt-7 text-xs font-bold tracking-[0.18em] text-amber-300">
              ACCESS DENIED
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Administrator access required
            </h1>

            <p className="mt-4 leading-7 text-slate-400">
              You are signed in as{" "}
              <span className="font-semibold text-slate-200">
                            {user.email}
                        </span>{" "}
              but this account is not authorized.
            </p>

            <div className="mt-8 flex justify-center">
              <SignOutButton />
            </div>
          </div>
        </main>
    );
  }

  const [
    profilesResult,
    generationsResult,
    votesResult,
    moviesResult,
  ] = await Promise.all([
    supabase
        .from("profiles")
        .select(
            "id, first_name, last_name, created_at, is_superadmin"
        )
        .order("created_at", { ascending: false }),

    supabase
        .from("generations")
        .select(
            "id, movie_id, prompt, generated_text, created_at"
        )
        .order("created_at", { ascending: false }),

    supabase
        .from("votes")
        .select("id, value, created_at")
        .order("created_at", { ascending: false }),

    supabase
        .from("movies")
        .select("id, title"),
  ]);

  const profiles =
      (profilesResult.data ?? []) as Profile[];

  const generations =
      (generationsResult.data ?? []) as Generation[];

  const votes =
      (votesResult.data ?? []) as Vote[];

  const movies =
      (moviesResult.data ?? []) as Movie[];

  const movieMap = new Map(
      movies.map((movie) => [
        movie.id,
        movie.title || "Untitled Movie",
      ])
  );

  const totalUsers = profiles.length;
  const totalGenerations = generations.length;
  const totalVotes = votes.length;

  const upvotes = votes.filter(
      (vote) => vote.value === 1
  ).length;

  const downvotes = votes.filter(
      (vote) => vote.value === -1
  ).length;

  const approvalRate =
      totalVotes > 0
          ? Math.round((upvotes / totalVotes) * 100)
          : 0;

  const recentProfiles = profiles.slice(0, 4);
  const recentGenerations = generations.slice(0, 5);

  const displayName =
      [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ") || "Administrator";

  return (
      <main className="min-h-screen bg-[#07111f] text-white">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#091522]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-cyan-300">
                AI CINEMA ADMIN
              </p>

              <h1 className="mt-1 text-xl font-bold">
                Administration Panel
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                  href="/users"
                  className="hidden rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                Users
              </Link>

              <Link
                  href="/generations"
                  className="hidden rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                Generations
              </Link>

              <Link
                  href="/votes"
                  className="hidden rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                Votes
              </Link>

              <div className="hidden text-right lg:block">
                <p className="text-sm font-semibold">
                  {displayName}
                </p>

                <p className="text-xs text-slate-500">
                  Super Admin
                </p>
              </div>

              <SignOutButton />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-10">
          <section className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs font-bold text-emerald-300">
              <span>●</span>
              ADMIN ACCESS VERIFIED
            </div>

            <h2 className="mt-5 text-4xl font-bold tracking-tight">
              Dashboard
            </h2>

            <p className="mt-3 max-w-2xl text-slate-400">
              Monitor users, AI-generated content, and community
              voting activity from one place.
            </p>
          </section>

          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <Link
                href="/users"
                className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-xl">
                👥
              </div>

              <p className="mt-6 text-xs font-bold tracking-[0.14em] text-cyan-300">
                USER MANAGEMENT
              </p>

              <h3 className="mt-2 text-xl font-bold">
                Profiles
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Review registered users and administrator roles.
              </p>

              <p className="mt-5 text-sm font-semibold text-cyan-300">
                Open Users →
              </p>
            </Link>

            <Link
                href="/generations"
                className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-violet-400/[0.04]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10 text-xl">
                ✦
              </div>

              <p className="mt-6 text-xs font-bold tracking-[0.14em] text-violet-300">
                AI CONTENT
              </p>

              <h3 className="mt-2 text-xl font-bold">
                Generations
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Create, read, update, and delete AI-generated
                taglines.
              </p>

              <p className="mt-5 text-sm font-semibold text-violet-300">
                Manage Content →
              </p>
            </Link>

            <Link
                href="/votes"
                className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-xl">
                👍
              </div>

              <p className="mt-6 text-xs font-bold tracking-[0.14em] text-emerald-300">
                COMMUNITY FEEDBACK
              </p>

              <h3 className="mt-2 text-xl font-bold">
                Votes
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Review upvotes, downvotes, ratings, and sentiment.
              </p>

              <p className="mt-5 text-sm font-semibold text-emerald-300">
                View Votes →
              </p>
            </Link>
          </section>

          <Week7Navigation />

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
                icon="👥"
                label="Total Users"
                value={totalUsers}
                accent="cyan"
            />

            <StatCard
                icon="✦"
                label="AI Generations"
                value={totalGenerations}
                accent="violet"
            />

            <StatCard
                icon="🗳️"
                label="Total Votes"
                value={totalVotes}
                accent="blue"
            />

            <StatCard
                icon="👍"
                label="Upvotes"
                value={upvotes}
                accent="green"
            />

            <StatCard
                icon="👎"
                label="Downvotes"
                value={downvotes}
                accent="red"
            />

            <StatCard
                icon="📈"
                label="Approval Rate"
                value={`${approvalRate}%`}
                accent="amber"
            />
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035]">
              <div className="flex items-center justify-between border-b border-white/10 p-6">
                <div>
                  <p className="text-xs font-bold tracking-[0.15em] text-violet-300">
                    AI CONTENT
                  </p>

                  <h3 className="mt-2 text-xl font-bold">
                    Recent Generations
                  </h3>
                </div>

                <Link
                    href="/generations"
                    className="text-sm font-semibold text-violet-300 hover:text-violet-200"
                >
                  View all →
                </Link>
              </div>

              <div className="divide-y divide-white/10">
                {recentGenerations.map(
                    (generation) => (
                        <div
                            key={generation.id}
                            className="p-6"
                        >
                          <div className="flex items-start justify-between gap-5">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-cyan-300">
                                {movieMap.get(
                                        generation.movie_id
                                    ) ||
                                    `Movie #${generation.movie_id}`}
                              </p>

                              <p className="mt-2 line-clamp-2 font-medium text-slate-100">
                                “
                                {
                                  generation.generated_text
                                }
                                ”
                              </p>

                              <p className="mt-3 line-clamp-1 text-xs text-slate-500">
                                Direction:{" "}
                                {generation.prompt}
                              </p>
                            </div>

                            <span className="shrink-0 text-xs text-slate-600">
                                                {formatDate(
                                                    generation.created_at
                                                )}
                                            </span>
                          </div>
                        </div>
                    )
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035]">
              <div className="flex items-center justify-between border-b border-white/10 p-6">
                <div>
                  <p className="text-xs font-bold tracking-[0.15em] text-cyan-300">
                    USERS
                  </p>

                  <h3 className="mt-2 text-xl font-bold">
                    Recent Profiles
                  </h3>
                </div>

                <Link
                    href="/users"
                    className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  View all →
                </Link>
              </div>

              <div className="divide-y divide-white/10">
                {recentProfiles.map((item) => {
                  const name =
                      [
                        item.first_name,
                        item.last_name,
                      ]
                          .filter(Boolean)
                          .join(" ") ||
                      "Unnamed User";

                  return (
                      <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 p-5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10 font-bold text-cyan-300">
                            {name
                                .charAt(0)
                                .toUpperCase()}
                          </div>

                          <div>
                            <p className="text-sm font-semibold">
                              {name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Joined{" "}
                              {formatDate(
                                  item.created_at
                              )}
                            </p>
                          </div>
                        </div>

                        {item.is_superadmin && (
                            <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[10px] font-bold text-violet-300">
                                                ADMIN
                                            </span>
                        )}
                      </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-7">
            <p className="text-xs font-bold tracking-[0.18em] text-violet-300">
              SECURITY STATUS
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">
                  Authentication
                </p>

                <p className="mt-1 font-semibold text-emerald-300">
                  ✓ Google verified
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Authorization
                </p>

                <p className="mt-1 font-semibold text-emerald-300">
                  ✓ is_superadmin = true
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Signed in as
                </p>

                <p className="mt-1 truncate font-semibold text-slate-200">
                  {user.email}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
  );
}

function StatCard({
                    icon,
                    label,
                    value,
                    accent,
                  }: {
  icon: string;
  label: string;
  value: number | string;
  accent:
      | "cyan"
      | "violet"
      | "blue"
      | "green"
      | "red"
      | "amber";
}) {
  const styles = {
    cyan: "bg-cyan-400/10 text-cyan-300",
    violet: "bg-violet-400/10 text-violet-300",
    blue: "bg-blue-400/10 text-blue-300",
    green: "bg-emerald-400/10 text-emerald-300",
    red: "bg-red-400/10 text-red-300",
    amber: "bg-amber-400/10 text-amber-300",
  };

  return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
        <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${styles[accent]}`}
        >
          {icon}
        </div>

        <p className="mt-6 text-sm text-slate-500">
          {label}
        </p>

        <p className="mt-1 text-3xl font-bold tracking-tight">
          {value}
        </p>
      </div>
  );
}
