"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GoogleLoginButton() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin() {
        setLoading(true);
        setError("");

        const supabase = createClient();

        const redirectTo =
            `${window.location.origin}/auth/callback?next=/`;

        const { error } =
            await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo,
                },
            });

        if (error) {
            setError(error.message);
            setLoading(false);
        }
    }

    return (
        <div className="w-full">
            <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="
                    flex w-full items-center justify-center gap-3
                    rounded-xl bg-white px-5 py-4
                    font-semibold text-slate-900
                    transition hover:bg-slate-100
                    disabled:cursor-wait disabled:opacity-60
                "
            >
                <span
                    className="
                        flex h-8 w-8 items-center justify-center
                        rounded-lg border border-slate-200
                        text-lg font-bold text-blue-600
                    "
                >
                    G
                </span>

                {loading
                    ? "Connecting..."
                    : "Continue with Google"}
            </button>

            {error && (
                <p className="mt-3 text-sm text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}