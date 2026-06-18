import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const demoProfile: Profile = {
  id: "demo-user",
  email: "demo@jifu.local",
  full_name: "示範管理員",
  avatar_url: null,
  role: "super_admin",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export async function getCurrentProfile() {
  if (!isSupabaseConfigured()) {
    return { user: null, profile: demoProfile, demoMode: true };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase!.auth.getUser();

  if (!user) redirect("/login");

  const role =
    user.email && process.env.SUPER_ADMIN_EMAIL === user.email
      ? "super_admin"
      : "staff";

  const profilePayload = {
    id: user.id,
    email: user.email ?? "",
    full_name:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split("@")[0] ??
      "",
    avatar_url: user.user_metadata?.avatar_url ?? null,
    role,
    is_active: true,
    updated_at: new Date().toISOString()
  };

  await supabase!.from("profiles").upsert(profilePayload, {
    onConflict: "id",
    ignoreDuplicates: false
  });

  const { data } = await supabase!
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return { user, profile: data ?? demoProfile, demoMode: false };
}

export function canManage(role: string) {
  return ["super_admin", "admin", "manager"].includes(role);
}

export function canAdmin(role: string) {
  return ["super_admin", "admin"].includes(role);
}
