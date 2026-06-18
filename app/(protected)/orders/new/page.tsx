import { OrderForm } from "@/components/order-form";
import { getCurrentProfile } from "@/lib/auth";
import { getCategories, getVendors } from "@/lib/data";

export default async function NewOrderPage() {
  const [{ profile }, vendors, categories] = await Promise.all([
    getCurrentProfile(),
    getVendors(),
    getCategories()
  ]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">新增發包紀錄</h1>
        <p className="mt-1 text-sm text-muted-foreground">填寫基本資料、付款資料與附件資料</p>
      </div>
      <OrderForm vendors={vendors} categories={categories} profile={profile} />
    </div>
  );
}
