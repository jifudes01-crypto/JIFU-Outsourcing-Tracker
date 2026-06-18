import { ReportsClient } from "@/components/dashboard-client";
import { getOrders } from "@/lib/data";

export default async function ReportsPage() {
  const orders = await getOrders();
  return <ReportsClient orders={orders} />;
}
