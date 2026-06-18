import { z } from "zod";
import { orderStatuses, paymentMethods, paymentStatuses } from "@/lib/constants";

export const orderSchema = z.object({
  order_date: z.string().min(1, "請選擇發包日期"),
  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().min(1, "請輸入廠商"),
  requester: z.string().nullable().optional(),
  creator_id: z.string().nullable().optional(),
  creator_name: z.string().nullable().optional(),
  item_name: z.string().min(1, "請輸入製作內容"),
  category: z.string().min(1, "請選擇類別"),
  quantity: z.coerce.number().min(0, "數量需為數字"),
  unit_price: z.coerce.number().min(0, "單價需為數字"),
  total_price: z.coerce.number().min(0, "總價需為數字"),
  status: z.enum(orderStatuses),
  payment_status: z.enum(paymentStatuses),
  payment_date: z.string().nullable().optional(),
  payment_method: z.enum(paymentMethods).nullable().optional(),
  payment_note: z.string().nullable().optional(),
  invoice_file_url: z.string().nullable().optional(),
  invoice_file_name: z.string().nullable().optional(),
  remittance_file_url: z.string().nullable().optional(),
  remittance_file_name: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  created_by: z.string().nullable().optional(),
  updated_by: z.string().nullable().optional(),
  version: z.coerce.number().optional()
});

export const vendorSchema = z.object({
  vendor_name: z.string().min(1, "請輸入廠商名稱"),
  contact_person: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  note: z.string().nullable().optional()
});

export const categorySchema = z.object({
  category_name: z.string().min(1, "請輸入類別名稱"),
  sort_order: z.coerce.number().default(0)
});
