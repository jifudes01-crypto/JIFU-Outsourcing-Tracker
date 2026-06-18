"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createOrderAction, updateOrderAction } from "@/app/actions";
import { orderStatuses, paymentMethods, paymentStatuses } from "@/lib/constants";
import type { Category, OutsourceOrder, Profile, Vendor } from "@/lib/types";
import { orderSchema } from "@/lib/validation";

export function OrderForm({
  order,
  vendors,
  categories,
  profile
}: {
  order?: OutsourceOrder | null;
  vendors: Vendor[];
  categories: Category[];
  profile: Profile;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const defaults = useMemo<Record<string, unknown>>(
    () => ({
      order_date: order?.order_date ?? new Date().toISOString().slice(0, 10),
      vendor_id: order?.vendor_id ?? null,
      vendor_name: order?.vendor_name ?? "",
      requester: order?.requester ?? "",
      creator_id: order?.creator_id ?? profile.id,
      creator_name: order?.creator_name ?? profile.full_name ?? profile.email,
      item_name: order?.item_name ?? "",
      category: order?.category ?? categories[0]?.category_name ?? "其他",
      quantity: order?.quantity ?? 1,
      unit_price: order?.unit_price ?? 0,
      total_price: order?.total_price ?? 0,
      status: order?.status ?? "發包中",
      payment_status: order?.payment_status ?? "未付款",
      payment_date: order?.payment_date ?? null,
      payment_method: order?.payment_method ?? null,
      payment_note: order?.payment_note ?? "",
      invoice_file_url: order?.invoice_file_url ?? null,
      invoice_file_name: order?.invoice_file_name ?? null,
      remittance_file_url: order?.remittance_file_url ?? null,
      remittance_file_name: order?.remittance_file_name ?? null,
      note: order?.note ?? "",
      created_by: order?.created_by ?? profile.id,
      updated_by: profile.id,
      version: order?.version ?? 1
    }),
    [categories, order, profile]
  );

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(orderSchema) as never,
    defaultValues: defaults
  });
  const quantity = Number(useWatch({ control: form.control, name: "quantity" }) ?? 0);
  const unitPrice = Number(useWatch({ control: form.control, name: "unit_price" }) ?? 0);
  const total = quantity * unitPrice;

  const onSubmit = (values: Record<string, unknown>) => {
    startTransition(async () => {
      const payload = { ...values, total_price: total };
      const result = order?.id
        ? await updateOrderAction(order.id, payload)
        : await createOrderAction(payload);
      if (!result.ok) {
        form.setError("root", { message: result.message });
        return;
      }
      router.push(`/orders/${result.id ?? order?.id}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {form.formState.errors.root?.message ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {form.formState.errors.root.message}
        </div>
      ) : null}
      <FormSection title="基本資料">
        <Field label="發包日期" error={form.formState.errors.order_date?.message}>
          <Input type="date" {...form.register("order_date")} />
        </Field>
        <Field label="廠商" error={form.formState.errors.vendor_name?.message}>
          <Input list="vendors" {...form.register("vendor_name")} />
          <datalist id="vendors">
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.vendor_name} />
            ))}
          </datalist>
        </Field>
        <Field label="需求人">
          <Input {...form.register("requester")} />
        </Field>
        <Field label="製作內容" error={form.formState.errors.item_name?.message}>
          <Input {...form.register("item_name")} />
        </Field>
        <Field label="類別" error={form.formState.errors.category?.message}>
          <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" {...form.register("category")}>
            {categories.map((category) => (
              <option key={category.id} value={category.category_name}>
                {category.category_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="數量">
          <Input type="number" step="0.01" {...form.register("quantity", { valueAsNumber: true })} />
        </Field>
        <Field label="單價">
          <Input type="number" step="1" {...form.register("unit_price", { valueAsNumber: true })} />
        </Field>
        <Field label="總價">
          <Input readOnly value={total} />
        </Field>
        <Field label="狀態">
          <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" {...form.register("status")}>
            {orderStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </Field>
      </FormSection>
      <FormSection title="付款資料">
        <Field label="付款狀態">
          <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" {...form.register("payment_status")}>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </Field>
        <Field label="付款日期">
          <Input type="date" {...form.register("payment_date")} />
        </Field>
        <Field label="付款方式">
          <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" {...form.register("payment_method")}>
            <option value="">未選擇</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </Field>
        <Field label="付款備註">
          <Textarea {...form.register("payment_note")} />
        </Field>
      </FormSection>
      <FormSection title="附件資料">
        <Field label="發票 / 收據圖片">
          <Input placeholder="上傳後自動填入 URL" {...form.register("invoice_file_url")} />
        </Field>
        <Field label="匯款紀錄圖片">
          <Input placeholder="上傳後自動填入 URL" {...form.register("remittance_file_url")} />
        </Field>
      </FormSection>
      <FormSection title="系統資料">
        <Field label="建立者">
          <Input readOnly {...form.register("creator_name")} />
        </Field>
        <Field label="備註">
          <Textarea {...form.register("note")} />
        </Field>
      </FormSection>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>取消</Button>
        <Button disabled={isPending} type="submit">
          <Save className="h-4 w-4" />
          {isPending ? "儲存中..." : "儲存"}
        </Button>
      </div>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
