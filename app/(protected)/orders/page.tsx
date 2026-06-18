import { OrdersClient } from "@/components/orders-client";
import { getCurrentProfile } from "@/lib/auth";
import { getCategories, getOrders, getProfiles, getVendors } from "@/lib/data";

export default async function OrdersPage() {
  const [{ profile }, orders, vendors, categories, profiles] = await Promise.all([
    getCurrentProfile(),
    getOrders(),
    getVendors(),
    getCategories(),
    getProfiles()
  ]);
  return <OrdersClient initialOrders={orders} vendors={vendors} categories={categories} profiles={profiles} profile={profile} />;
}
