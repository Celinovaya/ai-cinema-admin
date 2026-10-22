"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
    const [loading, setLoading] = useState(false);

    async function handleSignOut() {
        setLoading(true);

        const supabase = createClient();

        await supabase.auth.signOut();

        window.location.href = "/";
    }

    return (
        <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="
                rounded-lg border border-white/10
                bg-white/5 px-4 py-2
                text-sm font-medium text-slate-300
                transition hover:bg-white/10 hover:text-white
                disabled:opacity-50
            "
        >
            {loading ? "Signing out..." : "Sign out"}
        </button>
    );
}