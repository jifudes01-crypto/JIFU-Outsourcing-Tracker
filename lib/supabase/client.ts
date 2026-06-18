import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/utils";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase 尚未設定，請填入 .env.local。");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
