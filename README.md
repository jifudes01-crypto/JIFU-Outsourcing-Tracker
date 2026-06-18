# 吉富發包紀錄管理系統

JIFU Outsourcing Tracker 是以 Next.js 15、Supabase、Google OAuth、Supabase Storage、Realtime、Recharts、xlsx 與 jsPDF 建立的發包紀錄管理系統。

## 功能

- Google 帳號登入與首次登入自動建立使用者資料
- 角色權限：`super_admin`、`admin`、`manager`、`staff`、`viewer`
- 發包紀錄 CRUD、廠商 CRUD、類別 CRUD
- 發票 / 收據與匯款紀錄附件上傳、預覽、下載
- Excel 匯入：欄位自動辨識、預覽、錯誤檢查、重複處理、自動建立廠商與分類、錯誤報告
- Excel 匯出與 PDF 匯出
- Dashboard 統計卡與 Recharts 報表
- 我的發包紀錄、付款管理、附件管理、使用者管理、操作紀錄
- Supabase Realtime 即時同步
- `version` optimistic locking 防止多人覆蓋
- Supabase RLS 與 Storage policy，附件 bucket 使用 `invoices` 與 `remittances`

## 環境變數

複製 `.env.example` 為 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPER_ADMIN_EMAIL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPER_ADMIN_EMAIL` 會讓指定 Email 首次登入後成為 `super_admin`。

## Supabase 設定

1. 建立 Supabase project。
2. 在 SQL Editor 執行：
   - `supabase/migrations/202606180001_initial_schema.sql`
   - 可選：`supabase/seed.sql`
3. 到 Authentication Providers 啟用 Google。
4. Google OAuth redirect URL 設定 Supabase 提供的 callback URL。
5. Site URL 設為 Vercel 網址或本機 `http://localhost:3000`。
6. Additional Redirect URLs 加入：
   - `http://localhost:3000/auth/callback`
   - `https://你的-vercel-domain.vercel.app/auth/callback`

## 本機開發

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm typecheck
pnpm build
```

## Vercel 部署

1. 將專案推送到 GitHub repository。
2. 在 Vercel 匯入該 repository。
3. 設定環境變數：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPER_ADMIN_EMAIL`
   - `NEXT_PUBLIC_SITE_URL`
4. 部署後，把 Vercel 網址加入 Supabase Auth redirect URLs。
5. 使用 `SUPER_ADMIN_EMAIL` 的 Google 帳號登入。

## Excel 匯入規則

可辨識欄位：

`發包日期`、`廠商`、`需求人`、`建立者`、`製作內容`、`類別`、`數量`、`單價`、`總價`、`狀態`、`付款狀態`、`付款日期`、`付款方式`、`付款備註`、`備註`

同義欄位：

- `廠商名稱` 對應 `廠商`
- `品項` 對應 `製作內容`
- `金額` 對應 `總價`
- `經手人` 對應 `建立者`

重複判斷：

`發包日期 + 廠商 + 製作內容 + 總價`

匯入時若廠商或類別不存在，系統會自動建立。

## 管理員登入方式

正式部署後，使用 `.env.local` 或 Vercel 環境變數中的 `SUPER_ADMIN_EMAIL` 對應 Google 帳號登入。

## 測試帳號

Google OAuth 正式環境無法建立假 Google 帳密。可用 seed/mock 資料預覽介面；正式測試請用公司 Google 帳號登入。
