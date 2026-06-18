import { notFound } from "next/navigation";
import { OrderForm } from "@/components/order-form";
import { getCurrentProfile } from "@/lib/auth";
import { getCategories, getOrder, getVendors } from "@/lib/data";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ profile }, order, vendors, categories] = await Promise.all([
    getCurrentProfile(),
    getOrder(id),
    getVendors(),
    getCategories()
  ]);
  if (!order) notFound();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">編輯發包紀錄</h1>
        <p className="mt-1 text-sm text-muted-foreground">系統會檢查版本，避免覆蓋其他使用者修改</p>
      </div>
      <OrderForm order={order} vendors={vendors} categories={categories} profile={profile} />
    </div>
  );
}
