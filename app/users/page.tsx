import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

type Profile = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    created_at: string | null;
    is_superadmin: boolean;
};

function formatDate(value: string | null) {
    if (!value) return "Unknown";

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

export default async function UsersPage() {
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
        .select("first_name, last_name, is_superadmin")
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

    const { data, error } = await supabase
        .from("profiles")
        .select(
            "id, first_name, last_name, avatar_url, created_at, is_superadmin"
        )
        .order("created_at", { ascending: false });

    const profiles = (data ?? []) as Profile[];

    const adminCount = profiles.filter(
        (profile) => profile.is_superadmin
    ).length;

    return (
        <main className="min-h-screen bg-[#07111f] text-white">
            <header className="border-b border-white/10 bg-[#091522]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-cyan-300">
                            AI CINEMA ADMIN
                        </p>

                        <h1 className="mt-1 text-xl font-bold">
                            User Management
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
                            href="/generations"
                            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                            Generations
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
                    <p className="text-xs font-bold tracking-[0.18em] text-cyan-300">
                        USERS / PROFILES
                    </p>

                    <h2 className="mt-3 text-4xl font-bold">
                        Registered Users
                    </h2>

                    <p className="mt-3 max-w-2xl text-slate-400">
                        Review accounts that have authenticated with the AI
                        Cinema application.
                    </p>
                </section>

                <section className="mb-7 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                        <p className="text-sm text-slate-500">
                            Total Profiles
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {profiles.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                        <p className="text-sm text-slate-500">
                            Super Admins
                        </p>

                        <p className="mt-2 text-3xl font-bold text-violet-300">
                            {adminCount}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                        <p className="text-sm text-slate-500">
                            Standard Users
                        </p>

                        <p className="mt-2 text-3xl font-bold text-cyan-300">
                            {profiles.length - adminCount}
                        </p>
                    </div>
                </section>

                {error ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-red-300">
                        {error.message}
                    </div>
                ) : (
                    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
                        <div className="grid grid-cols-[1.6fr_1.3fr_1fr_.7fr] gap-4 border-b border-white/10 bg-white/[0.025] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <div>User</div>
                            <div>User ID</div>
                            <div>Joined</div>
                            <div>Role</div>
                        </div>

                        <div className="divide-y divide-white/10">
                            {profiles.map((profile) => {
                                const name =
                                    [
                                        profile.first_name,
                                        profile.last_name,
                                    ]
                                        .filter(Boolean)
                                        .join(" ") || "Unnamed User";

                                return (
                                    <div
                                        key={profile.id}
                                        className="grid grid-cols-[1.6fr_1.3fr_1fr_.7fr] gap-4 px-6 py-5 transition hover:bg-white/[0.025]"
                                    >
                                        <div className="flex min-w-0 items-center gap-4">
                                            {profile.avatar_url ? (
                                                <img
                                                    src={profile.avatar_url}
                                                    alt=""
                                                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 font-bold text-cyan-300">
                                                    {name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                            )}

                                            <div className="min-w-0">
                                                <p className="truncate font-semibold">
                                                    {name}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Profile
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <code className="max-w-[210px] truncate rounded-md bg-black/20 px-2 py-1 text-xs text-slate-400">
                                                {profile.id}
                                            </code>
                                        </div>

                                        <div className="flex items-center text-sm text-slate-400">
                                            {formatDate(profile.created_at)}
                                        </div>

                                        <div className="flex items-center">
                                            {profile.is_superadmin ? (
                                                <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-300">
                                                    SUPER ADMIN
                                                </span>
                                            ) : (
                                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-400">
                                                    USER
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <div className="mt-6 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.035] p-4 text-sm text-slate-400">
                    🔒 Profiles are read-only in this admin interface. Admin
                    authorization is controlled through the database.
                </div>
            </div>
        </main>
    );
}