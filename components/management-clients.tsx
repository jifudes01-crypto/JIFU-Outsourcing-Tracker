"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteCategoryAction,
  deleteVendorAction,
  updateUserRoleAction,
  upsertCategoryAction,
  upsertVendorAction
} from "@/app/actions";
import { roles } from "@/lib/constants";
import type { AuditLog, Category, ImportLog, Profile, Vendor } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function VendorsClient({ vendors }: { vendors: Vendor[] }) {
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [isPending, startTransition] = useTransition();
  const empty = { vendor_name: "", contact_person: "", phone: "", email: "", address: "", note: "" };
  const [form, setForm] = useState(empty);
  const submit = () =>
    startTransition(async () => {
      await upsertVendorAction(form, editing?.id);
      setEditing(null);
      setForm(empty);
    });
  return (
    <CrudShell title="廠商管理" description="新增、編輯、刪除與搜尋合作廠商">
      <Card>
        <CardHeader><CardTitle>{editing ? "編輯廠商" : "新增廠商"}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            ["vendor_name", "廠商名稱"],
            ["contact_person", "聯絡人"],
            ["phone", "電話"],
            ["email", "Email"],
            ["address", "地址"]
          ].map(([key, label]) => (
            <Input key={key} placeholder={label} value={String(form[key as keyof typeof form] ?? "")} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
          ))}
          <Textarea placeholder="備註" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          <Button disabled={isPending} onClick={submit}>{editing ? "更新廠商" : "新增廠商"}</Button>
        </CardContent>
      </Card>
      <SimpleTable
        headers={["廠商名稱", "聯絡人", "電話", "Email", "地址", "備註", "操作"]}
        rows={vendors.map((vendor) => [
          vendor.vendor_name,
          vendor.contact_person,
          vendor.phone,
          vendor.email,
          vendor.address,
          vendor.note,
          <div className="flex gap-2" key={vendor.id}>
            <Button size="sm" variant="outline" onClick={() => { setEditing(vendor); setForm({ vendor_name: vendor.vendor_name, contact_person: vendor.contact_person ?? "", phone: vendor.phone ?? "", email: vendor.email ?? "", address: vendor.address ?? "", note: vendor.note ?? "" }); }}>編輯</Button>
            <Button size="sm" variant="destructive" onClick={() => void deleteVendorAction(vendor.id)}>刪除</Button>
          </div>
        ])}
      />
    </CrudShell>
  );
}

export function CategoriesClient({ categories }: { categories: Category[] }) {
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  return (
    <CrudShell title="類別管理" description="新增、編輯、刪除與排序類別">
      <Card>
        <CardHeader><CardTitle>新增類別</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_160px_120px]">
          <Input placeholder="類別名稱" value={name} onChange={(event) => setName(event.target.value)} />
          <Input type="number" placeholder="排序" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} />
          <Button onClick={() => { void upsertCategoryAction({ category_name: name, sort_order: sortOrder }); setName(""); setSortOrder(0); }}>新增</Button>
        </CardContent>
      </Card>
      <SimpleTable
        headers={["類別名稱", "排序", "建立時間", "操作"]}
        rows={categories.map((category) => [
          category.category_name,
          category.sort_order,
          formatDate(category.created_at),
          <Button key={category.id} size="sm" variant="destructive" onClick={() => void deleteCategoryAction(category.id)}>刪除</Button>
        ])}
      />
    </CrudShell>
  );
}

export function UsersClient({ profiles }: { profiles: Profile[] }) {
  return (
    <CrudShell title="使用者管理" description="查看使用者、修改角色、停用使用者">
      <SimpleTable
        headers={["姓名", "Email", "角色", "狀態", "建立時間", "操作"]}
        rows={profiles.map((profile) => [
          profile.full_name,
          profile.email,
          <select
            key={`${profile.id}-role`}
            defaultValue={profile.role}
            className="h-9 rounded-md border bg-white px-2"
            onChange={(event) => void updateUserRoleAction(profile.id, event.target.value, profile.is_active)}
          >
            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>,
          profile.is_active ? "啟用" : "停用",
          formatDate(profile.created_at),
          <Button key={profile.id} size="sm" variant="outline" onClick={() => void updateUserRoleAction(profile.id, profile.role, !profile.is_active)}>
            {profile.is_active ? "停用" : "啟用"}
          </Button>
        ])}
      />
    </CrudShell>
  );
}

export function AuditLogsClient({ logs }: { logs: AuditLog[] }) {
  return (
    <CrudShell title="操作紀錄" description="追蹤新增、修改、刪除與附件操作">
      <SimpleTable
        headers={["操作時間", "操作人", "操作類型", "關聯發包紀錄", "修改前資料", "修改後資料"]}
        rows={logs.map((log) => [
          formatDate(log.created_at),
          log.user_name,
          log.action,
          log.order_id,
          JSON.stringify(log.before_data ?? {}),
          JSON.stringify(log.after_data ?? {})
        ])}
      />
    </CrudShell>
  );
}

export function ImportLogsClient({ logs }: { logs: ImportLog[] }) {
  return (
    <CrudShell title="匯入紀錄" description="Excel 匯入批次處理紀錄">
      <SimpleTable
        headers={["檔案名稱", "匯入人", "匯入時間", "總筆數", "成功", "失敗"]}
        rows={logs.map((log) => [
          log.file_name,
          log.imported_by_name,
          formatDate(log.created_at),
          log.total_rows,
          log.success_rows,
          log.failed_rows
        ])}
      />
    </CrudShell>
  );
}

export function RolePermissionsPage() {
  const rows = [
    ["super_admin", "全部系統管理、使用者、設定、資料與稽核"],
    ["admin", "查看全部、新增、編輯、刪除、匯出、管理使用者/廠商/類別"],
    ["manager", "查看全部、管理資料、匯入匯出與查看報表"],
    ["staff", "查看全部、新增、編輯自己建立資料、上傳附件、預設可匯入"],
    ["viewer", "查看紀錄與報表，不可新增、編輯、刪除或匯入"]
  ];
  return (
    <CrudShell title="角色權限" description="系統角色與授權範圍">
      <SimpleTable headers={["角色", "權限"]} rows={rows} />
    </CrudShell>
  );
}

export function SettingsPage() {
  return (
    <CrudShell title="系統設定" description="匯入、權限與部署設定">
      <Card>
        <CardContent className="space-y-3 p-5 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            staff 預設允許匯入 Excel
          </label>
          <div className="rounded-md bg-blue-50 p-3 text-primary">
            正式環境請在 Vercel 設定 Supabase 與 Google OAuth 環境變數。
          </div>
        </CardContent>
      </Card>
    </CrudShell>
  );
}

export function CrudShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="table-scroll rounded-lg border bg-white">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>{headers.map((header) => <th key={header} className="px-3 py-3 font-medium">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="max-w-80 truncate px-3 py-3">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
