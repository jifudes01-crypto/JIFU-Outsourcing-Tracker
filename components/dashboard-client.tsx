"use client";

import { Building2, DollarSign, FileSpreadsheet, ReceiptText } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportExcelDialog } from "@/components/import-excel-dialog";
import { StatCard } from "@/components/stat-card";
import { exportOrdersToExcel, exportOrdersToPdf } from "@/lib/exporters";
import type { Category, OutsourceOrder, Profile, Vendor } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const colors = ["#0068b7", "#22a6b3", "#10b981", "#f59e0b", "#ef4444", "#64748b"];

export function DashboardClient({
  orders,
  vendors,
  categories,
  profiles,
  profile
}: {
  orders: OutsourceOrder[];
  vendors: Vendor[];
  categories: Category[];
  profiles: Profile[];
  profile: Profile;
}) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthOrders = orders.filter((order) => order.order_date?.startsWith(currentMonth));
  const monthTotal = sum(monthOrders);
  const unpaidTotal = sum(orders.filter((order) => order.payment_status === "未付款" || order.payment_status === "部分付款"));
  const monthly = groupByMonth(orders);
  const vendorRank = groupBy(orders, "vendor_name").slice(0, 8);
  const categoryShare = groupBy(orders, "category");

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold">總覽看板</h1>
          <p className="mt-1 text-sm text-muted-foreground">掌握本月發包、付款、廠商與附件狀態</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportExcelDialog vendors={vendors} categories={categories} orders={orders} profiles={profiles} currentUserId={profile.id} />
          <Button variant="outline" onClick={() => exportOrdersToExcel(orders, "全部發包資料.xlsx")}>
            <FileSpreadsheet className="h-4 w-4" />
            匯出 Excel
          </Button>
          <Button variant="outline" onClick={() => exportOrdersToPdf(orders, "統計報表", profile.full_name ?? profile.email)}>
            匯出 PDF
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="本月總金額" value={formatCurrency(monthTotal)} description="依發包日期統計" icon={DollarSign} />
        <StatCard title="本月發包件數" value={`${monthOrders.length} 件`} description="即時同步資料" icon={ReceiptText} />
        <StatCard title="合作廠商數" value={`${vendors.length} 家`} description="含匯入自動建立" icon={Building2} />
        <StatCard title="未付款金額" value={formatCurrency(unpaidTotal)} description="未付款與部分付款" icon={DollarSign} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <ChartCard title="每月發包金額趨勢">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="total" name="金額" stroke="#0068b7" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="依類別支出比例">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryShare} dataKey="total" nameKey="name" outerRadius={100} label>
                {categoryShare.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="依廠商支出排行">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={vendorRank}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="total" name="支出金額" fill="#0068b7" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export function ReportsClient({ orders }: { orders: OutsourceOrder[] }) {
  const creatorStats = groupBy(orders, "creator_name");
  const itemStats = groupBy(orders, "item_name").slice(0, 12);
  const unpaid = orders.filter((order) => order.payment_status === "未付款" || order.payment_status === "部分付款");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">報表分析</h1>
        <p className="mt-1 text-sm text-muted-foreground">支出趨勢、廠商排行、分類比例與未付款追蹤</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="依建立者統計">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={creatorStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="total" name="金額" fill="#22a6b3" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="依製作內容統計">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={itemStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="total" name="金額" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>未付款清單</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="table-scroll rounded-md border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  {["日期", "廠商", "製作內容", "付款狀態", "總價", "建立者"].map((header) => (
                    <th key={header} className="px-3 py-2 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unpaid.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="px-3 py-2">{order.order_date}</td>
                    <td className="px-3 py-2">{order.vendor_name}</td>
                    <td className="px-3 py-2">{order.item_name}</td>
                    <td className="px-3 py-2">{order.payment_status}</td>
                    <td className="px-3 py-2">{formatCurrency(order.total_price)}</td>
                    <td className="px-3 py-2">{order.creator_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function sum(orders: OutsourceOrder[]) {
  return orders.reduce((total, order) => total + Number(order.total_price ?? 0), 0);
}

function groupByMonth(orders: OutsourceOrder[]) {
  const map = new Map<string, number>();
  orders.forEach((order) => {
    const key = order.order_date?.slice(0, 7) ?? "未設定";
    map.set(key, (map.get(key) ?? 0) + Number(order.total_price ?? 0));
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, total]) => ({ name, total }));
}

function groupBy(orders: OutsourceOrder[], key: keyof OutsourceOrder) {
  const map = new Map<string, number>();
  orders.forEach((order) => {
    const name = String(order[key] ?? "未設定");
    map.set(name, (map.get(name) ?? 0) + Number(order.total_price ?? 0));
  });
  return Array.from(map.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}
