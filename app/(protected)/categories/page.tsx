import { CategoriesClient } from "@/components/management-clients";
import { getCategories } from "@/lib/data";

export default async function CategoriesPage() {
  return <CategoriesClient categories={await getCategories()} />;
}
