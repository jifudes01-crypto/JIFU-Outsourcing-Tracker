"use client";

import Link from "next/link";
import { Download, Eye, FileText, Pencil, Plus, ReceiptText, Search, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImportExcelDialog } from "@/components/import-excel-dialog";
import { deleteOrderAction } from "@/app/actions";
import { INVOICE_BUCKET, REMITTANCE_BUCKET, orderStatuses, paymentStatuses } from "@/lib/constants";
import { exportOrdersToExcel, exportOrdersToPdf } from "@/lib/exporters";
import { createClient } from "@/lib/supabase/client";
import type { Category, OutsourceOrder, Profile, Vendor } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function OrdersClient({
  initialOrders,
  vendors,
  categories,
  profiles,
  profile,
  mode = "all"
}: {
  initialOrders: OutsourceOrder[];
  vendors: Vendor[];
  categories: Category[];
  profiles: Profile[];
  profile: Profile;
  mode?: "all" | "mine";
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [keyword, setKeyword] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [hasInvoice, setHasInvoice] = useState("");
  const [hasRemittance, setHasRemittance] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createClient();
    const channel = supabase
      .channel("outsource_orders_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "outsource_orders" },
        (payload) => {
          setOrders((current) => {
            if (payload.eventType === "DELETE") {
              return current.filter((order) => order.id !== (payload.old as { id: string }).id);
            }
            const next = payload.new as OutsourceOrder;
            const exists = current.some((order) => order.id === next.id);
            return exists
              ? current.map((order) => (order.id === next.id ? next : order))
              : [next, ...current];
          });
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (mode === "mine" && order.created_by !== profile.id && order.creator_id !== profile.id) return false;
      const text = [
        order.vendor_name,
        order.requester,
        order.item_name,
        order.category,
        order.creator_name,
        order.note
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!keyword || text.includes(keyword.toLowerCase())) &&
        (!vendor || order.vendor_name === vendor) &&
        (!category || order.category === category) &&
        (!status || order.status === status) &&
        (!paymentStatus || order.payment_status === paymentStatus) &&
        (!hasInvoice || Boolean(order.invoice_file_url) === (hasInvoice === "yes")) &&
        (!hasRemittance || Boolean(order.remittance_file_url) === (hasRemittance === "yes"))
      );
    });
  }, [category, hasInvoice, hasRemittance, keyword, mode, orders, paymentStatus, profile.id, status, vendor]);

  const uploadAttachment = async (order: OutsourceOrder, kind: "invoice" | "remittance", file: File) => {
    const supabase = createClient();
    const bucket = kind === "invoice" ? INVOICE_BUCKET : REMITTANCE_BUCKET;
    const safeName = `${Date.now()}-${file.name}`;
    const path = `${order.id}/${safeName}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) {
      alert(error.message);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const payload =
      kind === "invoice"
        ? { invoice_file_url: data.publicUrl, invoice_file_name: file.name }
        : { remittance_file_url: data.publicUrl, remittance_file_name: file.name };
    await supabase.from("outsource_orders").update(payload).eq("id", order.id);
  };

  const deleteOrder = (id: string) => {
    if (!confirm("確定要刪除此筆發包紀錄？")) return;
    startTransition(async () => {
      const result = await deleteOrderAction(id);
      if (!result.ok) alert(result.message);
      setOrders((current) => current.filter((order) => order.id !== id));
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-2xl font-semibold">{mode === "mine" ? "我的發包紀錄" : "發包紀錄列表"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">共 {filteredOrders.length} 筆資料</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportExcelDialog
            vendors={vendors}
            categories={categories}
            orders={orders}
            profiles={profiles}
            currentUserId={profile.id}
          />
          <Button variant="outline" onClick={() => exportOrdersToExcel(filteredOrders)}>
            <Download className="h-4 w-4" />
            匯出 Excel
          </Button>
          <Button variant="outline" onClick={() => exportOrdersToPdf(filteredOrders, mode === "mine" ? "我的紀錄報表" : "發包紀錄列表報表", profile.full_name ?? profile.email)}>
            <FileText className="h-4 w-4" />
            匯出 PDF
          </Button>
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="h-4 w-4" />
              新增發包紀錄
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-2 rounded-lg border bg-white p-3 md:grid-cols-3 xl:grid-cols-8">
        <div className="relative md:col-span-2 xl:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="關鍵字搜尋" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </div>
        <Select value={vendor} onChange={setVendor} options={vendors.map((item) => item.vendor_name)} placeholder="廠商" />
        <Select value={category} onChange={setCategory} options={categories.map((item) => item.category_name)} placeholder="類別" />
        <Select value={status} onChange={setStatus} options={[...orderStatuses]} placeholder="發包狀態" />
        <Select value={paymentStatus} onChange={setPaymentStatus} options={[...paymentStatuses]} placeholder="付款狀態" />
        <Select value={hasInvoice} onChange={setHasInvoice} options={["yes", "no"]} labels={{ yes: "有發票", no: "無發票" }} placeholder="發票" />
        <Select value={hasRemittance} onChange={setHasRemittance} options={["yes", "no"]} labels={{ yes: "有匯款", no: "無匯款" }} placeholder="匯款" />
      </div>
      <div className="table-scroll rounded-lg border bg-white">
        <table className="w-full min-w-[1320px] text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              {["發包日期", "廠商", "需求人", "製作內容", "類別", "數量", "單價", "總價", "狀態", "付款狀態", "建立者", "發票 / 收據", "匯款紀錄", "備註", "操作"].map((header) => (
                <th key={header} className="px-3 py-3 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-t hover:bg-slate-50">
                <td className="px-3 py-3">{order.order_date}</td>
                <td className="px-3 py-3">{order.vendor_name}</td>
                <td className="px-3 py-3">{order.requester}</td>
                <td className="px-3 py-3 font-medium">{order.item_name}</td>
                <td className="px-3 py-3">{order.category}</td>
                <td className="px-3 py-3">{order.quantity}</td>
                <td className="px-3 py-3">{formatCurrency(order.unit_price)}</td>
                <td className="px-3 py-3 font-semibold">{formatCurrency(order.total_price)}</td>
                <td className="px-3 py-3">{order.status}</td>
                <td className="px-3 py-3">{order.payment_status}</td>
                <td className="px-3 py-3">{order.creator_name}</td>
                <td className="px-3 py-3">
                  <AttachmentCell order={order} kind="invoice" onUpload={uploadAttachment} />
                </td>
                <td className="px-3 py-3">
                  <AttachmentCell order={order} kind="remittance" onUpload={uploadAttachment} />
                </td>
                <td className="max-w-44 truncate px-3 py-3">{order.note}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    <Button asChild size="icon" variant="ghost" title="查看">
                      <Link href={`/orders/${order.id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                    <Button asChild size="icon" variant="ghost" title="編輯">
                      <Link href={`/orders/${order.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="icon" variant="ghost" title="刪除" disabled={isPending} onClick={() => deleteOrder(order.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  labels
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  labels?: Record<string, string>;
}) {
  return (
    <select className="h-10 rounded-md border bg-white px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>{labels?.[option] ?? option}</option>
      ))}
    </select>
  );
}

function AttachmentCell({
  order,
  kind,
  onUpload
}: {
  order: OutsourceOrder;
  kind: "invoice" | "remittance";
  onUpload: (order: OutsourceOrder, kind: "invoice" | "remittance", file: File) => Promise<void>;
}) {
  const url = kind === "invoice" ? order.invoice_file_url : order.remittance_file_url;
  const label = kind === "invoice" ? "上傳發票 / 收據" : "上傳匯款紀錄";
  return (
    <div className="flex items-center gap-2">
      <ReceiptText className={url ? "h-4 w-4 text-primary" : "h-4 w-4 text-muted-foreground"} />
      <span>{url ? 1 : 0}</span>
      {url ? (
        <a className="text-primary underline" href={url} target="_blank" rel="noreferrer">預覽</a>
      ) : null}
      <label className="inline-flex cursor-pointer items-center">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <span className="sr-only">{label}</span>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onUpload(order, kind, file);
          }}
        />
      </label>
    </div>
  );
}
