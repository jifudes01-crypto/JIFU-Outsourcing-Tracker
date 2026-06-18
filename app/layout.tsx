import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME, APP_NAME_EN } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} | ${APP_NAME_EN}`,
  description: "吉富工商地產有限公司發包紀錄管理系統"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
