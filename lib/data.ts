import { createClient } from "@/lib/supabase/server";
import {
  demoAuditLogs,
  demoCategories,
  demoImportLogs,
  demoOrders,
  demoProfiles,
  demoVendors
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/utils";
import type { AuditLog, Category, ImportLog, OutsourceOrder, Profile, Vendor } from "@/lib/types";

export async function getOrders() {
  if (!isSupabaseConfigured()) return demoOrders;
  const supabase = await createClient();
  const { data } = await supabase!
    .from("outsource_orders")
    .select("*")
    .order("order_date", { ascending: false });
  return (data ?? demoOrders) as OutsourceOrder[];
}

export async function getOrder(id: string) {
  if (!isSupabaseConfigured()) return demoOrders.find((order) => order.id === id) ?? null;
  const supabase = await createClient();
  const { data } = await supabase!.from("outsource_orders").select("*").eq("id", id).single();
  return data as OutsourceOrder | null;
}

export async function getVendors() {
  if (!isSupabaseConfigured()) return demoVendors;
  const supabase = await createClient();
  const { data } = await supabase!.from("vendors").select("*").order("vendor_name");
  return (data ?? demoVendors) as Vendor[];
}

export async function getCategories() {
  if (!isSupabaseConfigured()) return demoCategories;
  const supabase = await createClient();
  const { data } = await supabase!.from("categories").select("*").order("sort_order");
  return (data ?? demoCategories) as Category[];
}

export async function getProfiles() {
  if (!isSupabaseConfigured()) return demoProfiles;
  const supabase = await createClient();
  const { data } = await supabase!.from("profiles").select("*").order("created_at");
  return (data ?? demoProfiles) as Profile[];
}

export async function getAuditLogs() {
  if (!isSupabaseConfigured()) return demoAuditLogs;
  const supabase = await createClient();
  const { data } = await supabase!.from("audit_logs").select("*").order("created_at", { ascending: false });
  return (data ?? demoAuditLogs) as AuditLog[];
}

export async function getImportLogs() {
  if (!isSupabaseConfigured()) return demoImportLogs;
  const supabase = await createClient();
  const { data } = await supabase!.from("import_logs").select("*").order("created_at", { ascending: false });
  return (data ?? demoImportLogs) as ImportLog[];
}
