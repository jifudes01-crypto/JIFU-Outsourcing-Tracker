"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categorySchema, orderSchema, vendorSchema } from "@/lib/validation";
import { isSupabaseConfigured } from "@/lib/utils";

async function getUserAndProfile() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase 尚未設定。");
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("請先登入。");
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return { supabase, user, profile };
}

export async function createOrderAction(input: unknown) {
  if (!isSupabaseConfigured()) return { ok: false, message: "示範模式無法寫入資料。" };
  const parsed = orderSchema.parse(input);
  const { supabase, user, profile } = await getUserAndProfile();
  const payload = {
    ...parsed,
    total_price: Number(parsed.quantity) * Number(parsed.unit_price),
    creator_id: parsed.creator_id || user.id,
    creator_name: parsed.creator_name || profile?.full_name || user.email,
    created_by: user.id,
    updated_by: user.id
  };
  const { data, error } = await supabase.from("outsource_orders").insert(payload).select().single();
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({
    order_id: data.id,
    action: "create",
    user_id: user.id,
    user_name: profile?.full_name ?? user.email,
    after_data: data
  });
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { ok: true, id: data.id };
}

export async function updateOrderAction(id: string, input: unknown) {
  if (!isSupabaseConfigured()) return { ok: false, message: "示範模式無法寫入資料。" };
  const parsed = orderSchema.parse(input);
  const version = parsed.version ?? 1;
  const { supabase, user, profile } = await getUserAndProfile();
  const { data: before } = await supabase.from("outsource_orders").select("*").eq("id", id).single();
  const { data, error } = await supabase
    .from("outsource_orders")
    .update({
      ...parsed,
      total_price: Number(parsed.quantity) * Number(parsed.unit_price),
      version: version + 1,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("version", version)
    .select()
    .single();
  if (error || !data) {
    return {
      ok: false,
      message: "此筆資料已被其他使用者更新，請重新整理後再編輯。"
    };
  }
  await supabase.from("audit_logs").insert({
    order_id: id,
    action: "update",
    user_id: user.id,
    user_name: profile?.full_name ?? user.email,
    before_data: before,
    after_data: data
  });
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  return { ok: true, id };
}

export async function deleteOrderAction(id: string) {
  if (!isSupabaseConfigured()) return { ok: false, message: "示範模式無法寫入資料。" };
  const { supabase, user, profile } = await getUserAndProfile();
  const { data: before } = await supabase.from("outsource_orders").select("*").eq("id", id).single();
  const { error } = await supabase.from("outsource_orders").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({
    order_id: id,
    action: "delete",
    user_id: user.id,
    user_name: profile?.full_name ?? user.email,
    before_data: before
  });
  revalidatePath("/orders");
  return { ok: true };
}

export async function upsertVendorAction(input: unknown, id?: string) {
  if (!isSupabaseConfigured()) return { ok: false, message: "示範模式無法寫入資料。" };
  const parsed = vendorSchema.parse(input);
  const { supabase } = await getUserAndProfile();
  const query = id
    ? supabase.from("vendors").update(parsed).eq("id", id)
    : supabase.from("vendors").insert(parsed);
  const { error } = await query;
  if (error) return { ok: false, message: error.message };
  revalidatePath("/vendors");
  return { ok: true };
}

export async function deleteVendorAction(id: string) {
  if (!isSupabaseConfigured()) return { ok: false, message: "示範模式無法寫入資料。" };
  const { supabase } = await getUserAndProfile();
  const { error } = await supabase.from("vendors").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/vendors");
  return { ok: true };
}

export async function upsertCategoryAction(input: unknown, id?: string) {
  if (!isSupabaseConfigured()) return { ok: false, message: "示範模式無法寫入資料。" };
  const parsed = categorySchema.parse(input);
  const { supabase } = await getUserAndProfile();
  const query = id
    ? supabase.from("categories").update(parsed).eq("id", id)
    : supabase.from("categories").insert(parsed);
  const { error } = await query;
  if (error) return { ok: false, message: error.message };
  revalidatePath("/categories");
  return { ok: true };
}

export async function deleteCategoryAction(id: string) {
  if (!isSupabaseConfigured()) return { ok: false, message: "示範模式無法寫入資料。" };
  const { supabase } = await getUserAndProfile();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/categories");
  return { ok: true };
}

export async function updateUserRoleAction(id: string, role: string, isActive: boolean) {
  if (!isSupabaseConfigured()) return { ok: false, message: "示範模式無法寫入資料。" };
  const { supabase } = await getUserAndProfile();
  const { error } = await supabase
    .from("profiles")
    .update({ role, is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/users");
  return { ok: true };
}

export async function recordImportLogAction(input: {
  file_name: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
}) {
  if (!isSupabaseConfigured()) return { ok: false, message: "示範模式無法寫入資料。" };
  const { supabase, user, profile } = await getUserAndProfile();
  const { error } = await supabase.from("import_logs").insert({
    ...input,
    imported_by: user.id,
    imported_by_name: profile?.full_name ?? user.email
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/orders");
  return { ok: true };
}
