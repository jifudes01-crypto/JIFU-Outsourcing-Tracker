import { UsersClient } from "@/components/management-clients";
import { getProfiles } from "@/lib/data";

export default async function UsersPage() {
  return <UsersClient profiles={await getProfiles()} />;
}
