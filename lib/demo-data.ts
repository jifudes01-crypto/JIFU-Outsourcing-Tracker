import type { AuditLog, Category, ImportLog, OutsourceOrder, Profile, Vendor } from "@/lib/types";
import { defaultCategories, orderStatuses, paymentStatuses } from "@/lib/constants";

const now = new Date();
const iso = now.toISOString();

export const demoProfiles: Profile[] = [
  { id: "u1", email: "admin@jifu.com.tw", full_name: "林怡君", avatar_url: null, role: "super_admin", is_active: true, created_at: iso, updated_at: iso },
  { id: "u2", email: "manager@jifu.com.tw", full_name: "陳冠廷", avatar_url: null, role: "manager", is_active: true, created_at: iso, updated_at: iso },
  { id: "u3", email: "staff1@jifu.com.tw", full_name: "王雅婷", avatar_url: null, role: "staff", is_active: true, created_at: iso, updated_at: iso },
  { id: "u4", email: "staff2@jifu.com.tw", full_name: "黃柏翰", avatar_url: null, role: "staff", is_active: true, created_at: iso, updated_at: iso },
  { id: "u5", email: "viewer@jifu.com.tw", full_name: "李佳蓉", avatar_url: null, role: "viewer", is_active: true, created_at: iso, updated_at: iso }
];

export const demoVendors: Vendor[] = [
  "宏達印刷有限公司",
  "晴川輸出中心",
  "藍點設計工作室",
  "光影攝影棚",
  "城市廣告工程",
  "永信耗材行",
  "大禾招牌",
  "品捷貼紙工坊"
].map((vendor_name, index) => ({
  id: `v${index + 1}`,
  vendor_name,
  contact_person: ["陳先生", "林小姐", "王先生", "張小姐"][index % 4],
  phone: `02-275${index}-88${index}${index}`,
  email: `vendor${index + 1}@example.com`,
  address: "台北市信義區基隆路一段",
  note: index % 2 === 0 ? "長期配合廠商" : null,
  created_at: iso,
  updated_at: iso
}));

export const demoCategories: Category[] = defaultCategories.map((category_name, index) => ({
  id: `c${index + 1}`,
  category_name,
  sort_order: index + 1,
  created_at: iso
}));

export const demoOrders: OutsourceOrder[] = Array.from({ length: 30 }).map((_, index) => {
  const vendor = demoVendors[index % demoVendors.length];
  const profile = demoProfiles[index % demoProfiles.length];
  const quantity = (index % 5) + 1;
  const unitPrice = 1200 + index * 350;
  const month = ((index % 6) + 1).toString().padStart(2, "0");
  const day = ((index % 24) + 1).toString().padStart(2, "0");
  const paid = index % 3 !== 0;
  return {
    id: `o${index + 1}`,
    order_date: `2026-${month}-${day}`,
    vendor_id: vendor.id,
    vendor_name: vendor.vendor_name,
    requester: ["業務部", "行政部", "總務部", "行銷部"][index % 4],
    creator_id: profile.id,
    creator_name: profile.full_name,
    item_name: ["名片印刷", "DM 輸出", "活動背板", "形象照拍攝", "招牌製作", "貼紙印刷"][index % 6],
    category: defaultCategories[index % defaultCategories.length],
    quantity,
    unit_price: unitPrice,
    total_price: quantity * unitPrice,
    status: orderStatuses[index % orderStatuses.length],
    payment_status: paymentStatuses[index % paymentStatuses.length],
    payment_date: paid ? `2026-${month}-${Math.min(Number(day) + 2, 28).toString().padStart(2, "0")}` : null,
    payment_method: paid ? ["現金", "匯款", "支票", "信用卡"][index % 4] : null,
    payment_note: paid ? "已完成付款確認" : "等待請款",
    invoice_file_url: index % 4 === 0 ? "https://example.com/invoice.pdf" : null,
    invoice_file_name: index % 4 === 0 ? `invoice-${index + 1}.pdf` : null,
    remittance_file_url: index % 5 === 0 ? "https://example.com/remittance.pdf" : null,
    remittance_file_name: index % 5 === 0 ? `remittance-${index + 1}.pdf` : null,
    note: index % 2 === 0 ? "依需求規格製作" : null,
    version: 1,
    created_by: profile.id,
    updated_by: profile.id,
    created_at: iso,
    updated_at: iso
  };
});

export const demoAuditLogs: AuditLog[] = demoOrders.slice(0, 8).map((order, index) => ({
  id: `a${index + 1}`,
  order_id: order.id,
  action: ["create", "update", "upload", "delete"][index % 4],
  user_id: order.created_by,
  user_name: order.creator_name,
  before_data: index % 2 ? { status: "發包中" } : null,
  after_data: { status: order.status, item_name: order.item_name },
  created_at: order.updated_at
}));

export const demoImportLogs: ImportLog[] = [
  {
    id: "i1",
    file_name: "2026-發包紀錄.xlsx",
    total_rows: 42,
    success_rows: 39,
    failed_rows: 3,
    imported_by: "u1",
    imported_by_name: "林怡君",
    created_at: iso
  }
];
