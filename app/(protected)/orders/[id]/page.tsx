import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrder } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const rows = [
    ["發包日期", formatDate(order.order_date)],
    ["廠商", order.vendor_name],
    ["需求人", order.requester],
    ["建立者", order.creator_name],
    ["製作內容", order.item_name],
    ["類別", order.category],
    ["數量", order.quantity],
    ["單價", formatCurrency(order.unit_price)],
    ["總價", formatCurrency(order.total_price)],
    ["狀態", order.status],
    ["付款狀態", order.payment_status],
    ["付款日期", formatDate(order.payment_date)],
    ["付款方式", order.payment_method],
    ["付款備註", order.payment_note],
    ["備註", order.note],
    ["版本", order.version]
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">查看發包紀錄</h1>
          <p className="mt-1 text-sm text-muted-foreground">{order.item_name}</p>
        </div>
        <Button asChild><Link href={`/orders/${order.id}/edit`}>編輯</Link></Button>
      </div>
      <Card>
        <CardHeader><CardTitle>紀錄明細</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={String(label)} className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 text-sm font-medium">{String(value ?? "-")}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
