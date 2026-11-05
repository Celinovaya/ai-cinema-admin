import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getAdminAccess() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, allowed: false, message: "Please sign in with Google to continue." };
  const { data: profile, error: profileError } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).maybeSingle();
  if (profileError) return { supabase, allowed: false, message: "Unable to verify administrator access. Please retry." };
  if (profile?.is_superadmin !== true) return { supabase, allowed: false, message: "This page is available only to super administrators." };
  return { supabase, allowed: true, message: "" };
}
