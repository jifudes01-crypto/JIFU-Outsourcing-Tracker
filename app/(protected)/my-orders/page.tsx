import { StatCard } from "@/components/stat-card";
import { OrdersClient } from "@/components/orders-client";
import { FileText, WalletCards } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { getCategories, getOrders, getProfiles, getVendors } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function MyOrdersPage() {
  const [{ profile }, orders, vendors, categories, profiles] = await Promise.all([
    getCurrentProfile(),
    getOrders(),
    getVendors(),
    getCategories(),
    getProfiles()
  ]);
  const mine = orders.filter((order) => order.created_by === profile.id || order.creator_id === profile.id);
  const total = mine.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0);
  const unpaid = mine.filter((order) => order.payment_status !== "已付款").reduce((sum, order) => sum + Number(order.total_price ?? 0), 0);
  const paid = total - unpaid;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="我的發包件數" value={`${mine.length} 件`} description="目前登入者建立" icon={FileText} />
        <StatCard title="我的發包總額" value={formatCurrency(total)} description="全部我的紀錄" icon={WalletCards} />
        <StatCard title="我的未付款金額" value={formatCurrency(unpaid)} description="未付款與部分付款" icon={WalletCards} />
        <StatCard title="我的已付款金額" value={formatCurrency(paid)} description="已付款統計" icon={WalletCards} />
      </div>
      <OrdersClient initialOrders={orders} vendors={vendors} categories={categories} profiles={profiles} profile={profile} mode="mine" />
    </div>
  );
}
