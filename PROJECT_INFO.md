# 吉富發包管理系統 Project Info

這是一個全新的專案，與任何既有吉富 DM 系統無關。

## 專案定位

- 專案名稱：吉富發包管理系統
- GitHub Repo：jifudes01-crypto/JIFU-Outsourcing-Tracker
- 用途：公司內部發包紀錄、廠商、付款、發票收據、匯款紀錄、Excel 匯入匯出、PDF 報表管理。

## 正式 Supabase 專案

- Supabase Project Name：吉富發包管理系統
- Supabase Project URL：https://qsgomtndebdfghgprnko.supabase.co
- Storage Buckets：invoices、remittances

## 重要限制

請不要把此專案視為以下專案的延伸、重構或升級：

- 吉富DM製作系統
- 每月精選物件 DM 套版網站
- jifu-dm-system
- Jifu DM

請不要讀取、修改或共用任何舊 DM 系統 Supabase 專案。

## Vercel Environment Variables

Vercel 需設定下列變數：

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPER_ADMIN_EMAIL
- NEXT_PUBLIC_SITE_URL

注意：不要把實際 key commit 到 GitHub。

## 下一步

1. 在 Supabase SQL Editor 執行 supabase/migrations/202606180001_initial_schema.sql。
2. 確認 Storage buckets invoices、remittances 已存在。
3. 在 Vercel 匯入 GitHub Repo。
4. 設定 Vercel Environment Variables。
5. 部署後回 Supabase Auth 設定 Site URL 與 Redirect URL。
6. 使用 SUPER_ADMIN_EMAIL 的 Google 帳號登入測試。
