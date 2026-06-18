import { AppShell } from "@/components/app-shell";
import { getCurrentProfile } from "@/lib/auth";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile, demoMode } = await getCurrentProfile();
  return (
    <AppShell profile={profile} demoMode={demoMode}>
      {children}
    </AppShell>
  );
}
