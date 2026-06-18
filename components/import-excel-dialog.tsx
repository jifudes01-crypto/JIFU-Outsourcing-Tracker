"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildErrorWorkbook, parseExcelFile, type ParsedImportRow } from "@/lib/importer";
import type { Category, OutsourceOrder, Profile, Vendor } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { recordImportLogAction } from "@/app/actions";

export function ImportExcelDialog({
  vendors,
  categories,
  orders,
  profiles,
  currentUserId
}: {
  vendors: Vendor[];
  categories: Category[];
  orders: OutsourceOrder[];
  profiles: Profile[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [message, setMessage] = useState("");
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "insert" | "update">("skip");
  const [isPending, startTransition] = useTransition();

  const parse = async (selected: File) => {
    setFile(selected);
    const result = await parseExcelFile(selected, vendors, categories, orders);
    setRows(result.rows);
    setMessage(`已讀取 ${result.rows.length} 筆資料，請確認預覽結果。`);
  };

  const importRows = () => {
    startTransition(async () => {
      const supabase = createClient();
      let success = 0;
      let failed = 0;
      const vendorMap = new Map(vendors.map((vendor) => [vendor.vendor_name, vendor.id]));

      for (const row of rows) {
        if (row.status === "欄位缺漏" || row.status === "格式錯誤") {
          failed += 1;
          continue;
        }
        if (row.status === "可能重複" && duplicateMode === "skip") {
          continue;
        }
        const vendorName = String(row.mapped.vendor_name ?? "");
        let vendorId = vendorMap.get(vendorName);
        if (!vendorId) {
          const { data } = await supabase
            .from("vendors")
            .insert({ vendor_name: vendorName })
            .select("id")
            .single();
          vendorId = data?.id;
          if (vendorId) vendorMap.set(vendorName, vendorId);
        }
        const categoryName = String(row.mapped.category ?? "");
        if (row.isNewCategory) {
          await supabase.from("categories").insert({ category_name: categoryName });
        }
        const creator = profiles.find(
          (profile) =>
            profile.full_name === row.mapped.creator_name ||
            profile.email === row.mapped.creator_name
        );
        const payload = {
          order_date: new Date(String(row.mapped.order_date)).toISOString().slice(0, 10),
          vendor_id: vendorId,
          vendor_name: vendorName,
          requester: row.mapped.requester,
          creator_id: creator?.id ?? currentUserId,
          creator_name: row.mapped.creator_name || creator?.full_name,
          item_name: row.mapped.item_name,
          category: categoryName,
          quantity: Number(row.mapped.quantity),
          unit_price: Number(row.mapped.unit_price),
          total_price: Number(row.mapped.total_price),
          status: row.mapped.status || "發包中",
          payment_status: row.mapped.payment_status || "未付款",
          payment_date: row.mapped.payment_date || null,
          payment_method: row.mapped.payment_method || null,
          payment_note: row.mapped.payment_note || null,
          note: row.mapped.note || null,
          created_by: currentUserId,
          updated_by: currentUserId
        };
        if (duplicateMode === "update" && row.status === "可能重複") {
          const match = orders.find(
            (order) =>
              order.order_date === payload.order_date &&
              order.vendor_name === payload.vendor_name &&
              order.item_name === payload.item_name &&
              Number(order.total_price) === Number(payload.total_price)
          );
          const { error } = match
            ? await supabase.from("outsource_orders").update(payload).eq("id", match.id)
            : await supabase.from("outsource_orders").insert(payload);
          if (error) failed += 1;
          else success += 1;
        } else {
          const { error } = await supabase.from("outsource_orders").insert(payload);
          if (error) failed += 1;
          else success += 1;
        }
      }
      await recordImportLogAction({
        file_name: file?.name ?? "未知檔案",
        total_rows: rows.length,
        success_rows: success,
        failed_rows: failed
      });
      setMessage(
        `匯入完成。成功匯入：${success} 筆，失敗：${failed} 筆，新增廠商：${rows.filter((row) => row.isNewVendor).length} 家，新增分類：${rows.filter((row) => row.isNewCategory).length} 個。`
      );
    });
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <FileSpreadsheet className="h-4 w-4" />
        匯入 Excel
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-6xl overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>匯入 Excel</CardTitle>
            <Button variant="ghost" onClick={() => setOpen(false)}>關閉</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
            <Upload className="mb-2 h-8 w-8 text-primary" />
            <span className="text-sm font-medium">上傳 Excel 檔案（.xlsx / .xls / .csv）</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) void parse(selected);
              }}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>重複資料處理：</span>
            {[
              ["skip", "略過重複資料"],
              ["insert", "仍然匯入"],
              ["update", "更新既有資料"]
            ].map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={duplicateMode === value ? "default" : "outline"}
                onClick={() => setDuplicateMode(value as typeof duplicateMode)}
              >
                {label}
              </Button>
            ))}
          </div>
          {message ? <div className="rounded-md bg-blue-50 p-3 text-sm text-primary">{message}</div> : null}
          <div className="table-scroll rounded-md border">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  {["狀態", "廠商", "製作內容", "類別", "數量", "單價", "總價", "標記", "錯誤"].map((header) => (
                    <th key={header} className="px-3 py-2 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 80).map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2">{row.mapped.vendor_name}</td>
                    <td className="px-3 py-2">{row.mapped.item_name}</td>
                    <td className="px-3 py-2">{row.mapped.category}</td>
                    <td className="px-3 py-2">{row.mapped.quantity}</td>
                    <td className="px-3 py-2">{row.mapped.unit_price}</td>
                    <td className="px-3 py-2">{row.mapped.total_price}</td>
                    <td className="px-3 py-2">
                      {[row.isNewVendor ? "新廠商" : "", row.isNewCategory ? "新分類" : ""].filter(Boolean).join("、")}
                    </td>
                    <td className="px-3 py-2 text-red-600">{row.messages.join("、")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => buildErrorWorkbook(rows)}>下載錯誤報告</Button>
            <Button disabled={!rows.length || isPending} onClick={importRows}>
              {isPending ? "匯入中..." : "確認匯入"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
