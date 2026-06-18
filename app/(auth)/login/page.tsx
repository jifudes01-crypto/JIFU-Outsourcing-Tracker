"use client";

import { Chrome, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_NAME_EN } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const signIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#eaf4ff,#ffffff_45%,#eef6ff)] p-6">
      <section className="grid w-full max-w-5xl gap-8 rounded-lg border bg-white p-6 shadow-sm md:grid-cols-[1.1fr_0.9fr] md:p-10">
        <div className="flex flex-col justify-between gap-10">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
              JF
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              {APP_NAME}
            </h1>
            <p className="mt-2 text-sm font-medium text-primary">{APP_NAME_EN}</p>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              比 Excel 更方便、更聰明的發包紀錄管理系統，集中管理廠商、付款、
              附件、匯入匯出與多人協作。
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-md border p-3">Google 帳號登入</div>
            <div className="rounded-md border p-3">權限與稽核紀錄</div>
            <div className="rounded-md border p-3">即時同步與防覆蓋</div>
          </div>
        </div>
        <div className="flex flex-col justify-center rounded-lg border bg-slate-50 p-6">
          <ShieldCheck className="mb-4 h-10 w-10 text-primary" />
          <h2 className="text-xl font-semibold">登入系統</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            請使用公司 Google 帳號登入。首次登入會自動建立使用者資料。
          </p>
          <Button onClick={signIn} className="mt-6 w-full">
            <Chrome className="h-4 w-4" />
            使用 Google 登入
          </Button>
          <p className="mt-4 text-xs text-slate-500">
            若尚未設定 Supabase 或 Google OAuth，請先依 README 填入環境變數。
          </p>
        </div>
      </section>
    </main>
  );
}
