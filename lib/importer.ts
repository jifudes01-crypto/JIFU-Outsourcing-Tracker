"use client";

import * as XLSX from "xlsx";
import type { Category, OutsourceOrder, Profile, Vendor } from "@/lib/types";

export type ImportRowStatus = "可匯入" | "欄位缺漏" | "格式錯誤" | "可能重複";

export type ParsedImportRow = {
  raw: Record<string, unknown>;
  mapped: Record<string, string | number | null>;
  status: ImportRowStatus;
  messages: string[];
  isNewVendor: boolean;
  isNewCategory: boolean;
};

const aliases: Record<string, string[]> = {
  order_date: ["發包日期", "日期", "建立日期"],
  vendor_name: ["廠商", "廠商名稱", "供應商"],
  requester: ["需求人", "申請人"],
  creator_name: ["建立者", "經手人", "承辦人"],
  item_name: ["製作內容", "品項", "項目", "內容"],
  category: ["類別", "分類"],
  quantity: ["數量", "件數"],
  unit_price: ["單價"],
  total_price: ["總價", "金額"],
  status: ["狀態", "發包狀態"],
  payment_status: ["付款狀態"],
  payment_date: ["付款日期"],
  payment_method: ["付款方式"],
  payment_note: ["付款備註"],
  note: ["備註"]
};

export const importFieldLabels: Record<string, string> = {
  order_date: "發包日期",
  vendor_name: "廠商",
  requester: "需求人",
  creator_name: "建立者",
  item_name: "製作內容",
  category: "類別",
  quantity: "數量",
  unit_price: "單價",
  total_price: "總價",
  status: "狀態",
  payment_status: "付款狀態",
  payment_date: "付款日期",
  payment_method: "付款方式",
  payment_note: "付款備註",
  note: "備註"
};

export async function parseExcelFile(
  file: File,
  vendors: Vendor[],
  categories: Category[],
  orders: OutsourceOrder[],
  mapping?: Record<string, string>
) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const headers = Object.keys(rows[0] ?? {});
  const resolvedMapping = mapping ?? autoMapHeaders(headers);
  const vendorNames = new Set(vendors.map((vendor) => vendor.vendor_name));
  const categoryNames = new Set(categories.map((category) => category.category_name));
  const duplicateKeys = new Set(
    orders.map((order) =>
      [order.order_date, order.vendor_name, order.item_name, Number(order.total_price)].join("|")
    )
  );

  const parsedRows: ParsedImportRow[] = rows.map((row) => {
    const mapped = Object.fromEntries(
      Object.entries(importFieldLabels).map(([key]) => [key, readMapped(row, resolvedMapping[key])])
    );
    const messages: string[] = [];
    const required = ["order_date", "vendor_name", "item_name", "category", "quantity", "unit_price"];
    required.forEach((key) => {
      if (!mapped[key]) messages.push(`${importFieldLabels[key]}為必填`);
    });
    ["quantity", "unit_price", "total_price"].forEach((key) => {
      if (mapped[key] !== "" && mapped[key] !== null && Number.isNaN(Number(mapped[key]))) {
        messages.push(`${importFieldLabels[key]}需為數字`);
      }
    });
    if (mapped.order_date && Number.isNaN(new Date(String(mapped.order_date)).getTime())) {
      messages.push("發包日期格式錯誤");
    }
    const total =
      mapped.total_price && !Number.isNaN(Number(mapped.total_price))
        ? Number(mapped.total_price)
        : Number(mapped.quantity || 0) * Number(mapped.unit_price || 0);
    const duplicateKey = [
      normalizeDate(mapped.order_date),
      mapped.vendor_name,
      mapped.item_name,
      total
    ].join("|");
    const isDuplicate = duplicateKeys.has(duplicateKey);
    if (isDuplicate) messages.push("可能重複匯入");
    const status: ImportRowStatus =
      messages.some((message) => message.includes("必填"))
        ? "欄位缺漏"
        : messages.some((message) => message.includes("格式"))
          ? "格式錯誤"
          : isDuplicate
            ? "可能重複"
            : "可匯入";

    return {
      raw: row,
      mapped: { ...mapped, total_price: total },
      status,
      messages,
      isNewVendor: Boolean(mapped.vendor_name && !vendorNames.has(String(mapped.vendor_name))),
      isNewCategory: Boolean(mapped.category && !categoryNames.has(String(mapped.category)))
    };
  });

  return { headers, mapping: resolvedMapping, rows: parsedRows };
}

export function autoMapHeaders(headers: string[]) {
  const mapping: Record<string, string> = {};
  Object.entries(aliases).forEach(([field, names]) => {
    mapping[field] = headers.find((header) => names.includes(header.trim())) ?? "";
  });
  return mapping;
}

export function buildErrorWorkbook(rows: ParsedImportRow[]) {
  const data = rows
    .filter((row) => row.status !== "可匯入")
    .map((row) => ({
      ...row.raw,
      錯誤原因: row.messages.join("、"),
      建議修正方式: "請補齊必填欄位、確認日期與金額格式，或選擇重複資料處理方式。"
    }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "錯誤報告");
  XLSX.writeFile(workbook, "匯入錯誤報告.xlsx");
}

export function findCreatorId(name: string | number | null | undefined, profiles: Profile[]) {
  if (!name) return null;
  const text = String(name).trim();
  return (
    profiles.find(
      (profile) => profile.email === text || profile.full_name === text || profile.id === text
    )?.id ?? null
  );
}

function readMapped(row: Record<string, unknown>, header: string | undefined) {
  if (!header) return "";
  const value = row[header];
  return value === undefined || value === "" ? "" : (value as string | number);
}

function normalizeDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}
