"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  UserRound
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME, navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const iconMap: Record<string, React.ReactNode> = {
  "/dashboard": <LayoutDashboard className="h-4 w-4" />
};

export function AppShell({
  profile,
  demoMode,
  children
}: {
  profile: Profile;
  demoMode: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    if (!demoMode) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  const sidebar = (
    <aside className="flex h-full w-68 flex-col border-r bg-white">
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary font-bold text-white">
          JF
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{APP_NAME}</div>
          <div className="truncate text-xs text-muted-foreground">JIFU Tracker</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                active && "bg-blue-50 font-medium text-primary"
              )}
            >
              {iconMap[item.href] ?? <span className="h-2 w-2 rounded-full bg-current opacity-60" />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-68 lg:block">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-900/35" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72">{sidebar}</div>
        </div>
      ) : null}
      <div className="lg:pl-68">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <PanelLeftClose className="hidden h-5 w-5 text-muted-foreground lg:block" />
            <div>
              <div className="text-sm font-semibold">發包紀錄管理</div>
              <div className="text-xs text-muted-foreground">
                {demoMode ? "示範模式：尚未連接 Supabase" : "已連線 Supabase"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="通知">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 rounded-md border px-3 py-2">
              {profile.avatar_url ? (
                <img alt="使用者頭像" src={profile.avatar_url} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-primary">
                  <UserRound className="h-4 w-4" />
                </div>
              )}
              <div className="hidden text-left sm:block">
                <div className="max-w-36 truncate text-xs font-medium">{profile.full_name ?? profile.email}</div>
                <div className="max-w-36 truncate text-[11px] text-muted-foreground">{profile.email}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              登出
            </Button>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
