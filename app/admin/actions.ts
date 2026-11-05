"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { getAdminAccess } from "@/lib/admin/auth";
import { getSection } from "@/lib/admin/sections";
import { databaseMessage, isUuid, validateValues } from "@/lib/admin/validation";

export async function mutateRecord(slug: string, operation: "create" | "update" | "delete", id: string | null, input: unknown) {
  try {
    // Recheck the current session and database role for EVERY mutation.
    const { supabase, allowed, message } = await getAdminAccess();
    if (!allowed) return { ok: false, message };
    const section = getSection(slug);
    if (!section || !["create", "update", "delete"].includes(operation) || section.mode === "read" || (section.mode === "update" && operation !== "update")) {
      return { ok: false, message: "This operation is not permitted." };
    }
    if (operation !== "create" && !isUuid(id)) return { ok: false, message: "Invalid record ID." };

    let values: Record<string, string | number | boolean | null> = {};
    if (operation !== "delete") {
      try { values = validateValues(section, input); }
      catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Invalid form values." }; }
      const now = new Date().toISOString();
      if (section.columns.includes("updated_at")) values.updated_at = now;
      if (operation === "create") {
        values.id = randomUUID();
        if (section.columns.includes("created_at")) values.created_at = now;
      }
    }

    const table = supabase.from(section.table);
    const query = operation === "create" ? table.insert(values) : operation === "update" ? table.update(values).eq("id", id!) : table.delete().eq("id", id!);
    // Returning exactly one ID prevents silently reporting success for an RLS-filtered or stale row.
    const { error } = await query.select("id").single();
    if (error) return { ok: false, message: databaseMessage(error.code) };
    revalidatePath(`/admin/${section.slug}`);
    return { ok: true, message: operation === "delete" ? "Record deleted." : operation === "create" ? "Record created." : "Changes saved." };
  } catch {
    return { ok: false, message: "Unable to complete the request. Check your connection and sign-in status, then retry." };
  }
}
