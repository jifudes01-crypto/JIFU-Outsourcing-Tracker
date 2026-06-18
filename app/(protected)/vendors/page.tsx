import { VendorsClient } from "@/components/management-clients";
import { getVendors } from "@/lib/data";

export default async function VendorsPage() {
  return <VendorsClient vendors={await getVendors()} />;
}
