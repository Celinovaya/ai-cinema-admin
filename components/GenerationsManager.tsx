"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

export default function GenerationsManager({
                                               generations,
                                               movies,
                                               currentUserId,
                                           }: {
    generations: Generation[];
    movies: Movie[];
    currentUserId: string;
}) {
    const router = useRouter();

    const [movieId, setMovieId] = useState(
        movies.length > 0
            ? String(movies[0].id)
            : ""
    );

    const [prompt, setPrompt] = useState("");
    const [generatedText, setGeneratedText] =
        useState("");

    const [editId, setEditId] =
        useState<string | null>(null);

    const [editMovieId, setEditMovieId] =
        useState("");

    const [editPrompt, setEditPrompt] =
        useState("");

    const [editText, setEditText] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const movieMap = new Map(
        movies.map((movie) => [
            movie.id,
            movie.title || "Untitled Movie",
        ])
    );

    function formatDate(value: string) {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date(value));
    }

    async function handleCreate(
        event: React.FormEvent
    ) {
        event.preventDefault();

        if (
            !movieId ||
            !prompt.trim() ||
            !generatedText.trim()
        ) {
            setMessage(
                "Please complete all fields."
            );
            return;
        }

        setLoading(true);
        setMessage("");

        const supabase = createClient();

        const { error } = await supabase
            .from("generations")
            .insert({
                user_id: currentUserId,
                movie_id: Number(movieId),
                prompt: prompt.trim(),
                generated_text:
                    generatedText.trim(),
            });

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        setPrompt("");
        setGeneratedText("");
        setMessage(
            "✓ New AI generation created."
        );

        setLoading(false);
        router.refresh();
    }

    function startEditing(
        generation: Generation
    ) {
        setEditId(generation.id);
        setEditMovieId(
            String(generation.movie_id)
        );
        setEditPrompt(generation.prompt);
        setEditText(
            generation.generated_text
        );
        setMessage("");
    }

    function cancelEditing() {
        setEditId(null);
        setEditMovieId("");
        setEditPrompt("");
        setEditText("");
    }

    async function handleUpdate(
        generationId: string
    ) {
        if (
            !editMovieId ||
            !editPrompt.trim() ||
            !editText.trim()
        ) {
            setMessage(
                "Please complete all edit fields."
            );
            return;
        }

        setLoading(true);
        setMessage("");

        const supabase = createClient();

        const { error } = await supabase
            .from("generations")
            .update({
                movie_id: Number(editMovieId),
                prompt: editPrompt.trim(),
                generated_text:
                    editText.trim(),
            })
            .eq("id", generationId);

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        setMessage(
            "✓ Generation updated successfully."
        );

        cancelEditing();
        setLoading(false);

        router.refresh();
    }

    async function handleDelete(
        generationId: string
    ) {
        const confirmed = window.confirm(
            "Delete this AI generation? This action cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        setLoading(true);
        setMessage("");

        const supabase = createClient();

        const { error } = await supabase
            .from("generations")
            .delete()
            .eq("id", generationId);

        if (error) {
            setMessage(
                "Delete failed: " +
                error.message +
                " If this generation already has votes, try deleting a newly created test generation instead."
            );

            setLoading(false);
            return;
        }

        setMessage(
            "✓ Generation deleted."
        );

        setLoading(false);
        router.refresh();
    }

    return (
        <div className="space-y-7">
            {/* CREATE */}

            <section className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.07] to-cyan-500/[0.03] p-6">
                <div className="mb-6">
                    <p className="text-xs font-bold tracking-[0.15em] text-violet-300">
                        CREATE
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                        Add AI Generation
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                        Administrators can manually add
                        AI-generated media to the database.
                    </p>
                </div>

                <form
                    onSubmit={handleCreate}
                    className="grid gap-5"
                >
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                            Movie
                        </label>

                        <select
                            value={movieId}
                            onChange={(event) =>
                                setMovieId(
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-white/10 bg-[#08111d] px-4 py-3 text-white outline-none transition focus:border-violet-400/50"
                        >
                            {movies.map((movie) => (
                                <option
                                    key={movie.id}
                                    value={movie.id}
                                >
                                    {movie.title}
                                    {movie.genre
                                        ? ` — ${movie.genre}`
                                        : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                            Creative Direction
                        </label>

                        <input
                            value={prompt}
                            onChange={(event) =>
                                setPrompt(
                                    event.target.value
                                )
                            }
                            placeholder="Example: Make it mysterious and cinematic."
                            className="w-full rounded-xl border border-white/10 bg-[#08111d] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                            AI Generated Tagline
                        </label>

                        <textarea
                            value={generatedText}
                            onChange={(event) =>
                                setGeneratedText(
                                    event.target.value
                                )
                            }
                            placeholder="Enter the generated tagline..."
                            rows={3}
                            className="w-full resize-y rounded-xl border border-white/10 bg-[#08111d] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                        {loading
                            ? "Saving..."
                            : "＋ Create Generation"}
                    </button>
                </form>
            </section>

            {message && (
                <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-5 py-4 text-sm text-cyan-200">
                    {message}
                </div>
            )}

            {/* READ / UPDATE / DELETE */}

            <section>
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold tracking-[0.15em] text-cyan-300">
                            READ / UPDATE / DELETE
                        </p>

                        <h3 className="mt-2 text-2xl font-bold">
                            All AI Generations
                        </h3>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">
                        {generations.length} records
                    </span>
                </div>

                <div className="space-y-4">
                    {generations.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-10 text-center text-slate-500">
                            No generations found.
                        </div>
                    ) : (
                        generations.map(
                            (generation) => {
                                const isEditing =
                                    editId ===
                                    generation.id;

                                return (
                                    <article
                                        key={
                                            generation.id
                                        }
                                        className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"
                                    >
                                        {isEditing ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold tracking-[0.15em] text-cyan-300">
                                                        EDITING
                                                        GENERATION
                                                    </p>

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            cancelEditing
                                                        }
                                                        className="text-sm text-slate-500 transition hover:text-white"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>

                                                <select
                                                    value={
                                                        editMovieId
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setEditMovieId(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-white/10 bg-[#08111d] px-4 py-3 text-white"
                                                >
                                                    {movies.map(
                                                        (
                                                            movie
                                                        ) => (
                                                            <option
                                                                key={
                                                                    movie.id
                                                                }
                                                                value={
                                                                    movie.id
                                                                }
                                                            >
                                                                {
                                                                    movie.title
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                                </select>

                                                <input
                                                    value={
                                                        editPrompt
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setEditPrompt(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-white/10 bg-[#08111d] px-4 py-3 text-white"
                                                />

                                                <textarea
                                                    value={
                                                        editText
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setEditText(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    rows={3}
                                                    className="w-full rounded-xl border border-white/10 bg-[#08111d] px-4 py-3 text-white"
                                                />

                                                <button
                                                    type="button"
                                                    disabled={
                                                        loading
                                                    }
                                                    onClick={() =>
                                                        handleUpdate(
                                                            generation.id
                                                        )
                                                    }
                                                    className="w-full rounded-xl bg-cyan-500 px-5 py-3 font-bold text-[#07111f] transition hover:bg-cyan-400 disabled:opacity-50"
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-col justify-between gap-5 lg:flex-row">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                                                                {movieMap.get(
                                                                        generation.movie_id
                                                                    ) ||
                                                                    `Movie #${generation.movie_id}`}
                                                            </span>

                                                            <span className="text-xs text-slate-600">
                                                                {formatDate(
                                                                    generation.created_at
                                                                )}
                                                            </span>
                                                        </div>

                                                        <blockquote className="mt-5 text-xl font-semibold leading-8 text-slate-100">
                                                            “
                                                            {
                                                                generation.generated_text
                                                            }
                                                            ”
                                                        </blockquote>

                                                        <p className="mt-4 text-sm leading-6 text-slate-500">
                                                            <span className="font-semibold text-slate-400">
                                                                Direction:
                                                            </span>{" "}
                                                            {
                                                                generation.prompt
                                                            }
                                                        </p>

                                                        <p className="mt-3 truncate font-mono text-[11px] text-slate-700">
                                                            ID:{" "}
                                                            {
                                                                generation.id
                                                            }
                                                        </p>
                                                    </div>

                                                    <div className="flex shrink-0 gap-2 lg:flex-col">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                startEditing(
                                                                    generation
                                                                )
                                                            }
                                                            className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
                                                        >
                                                            ✎ Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                loading
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    generation.id
                                                                )
                                                            }
                                                            className="rounded-lg border border-red-400/20 bg-red-400/[0.06] px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </article>
                                );
                            }
                        )
                    )}
                </div>
            </section>
        </div>
    );
}