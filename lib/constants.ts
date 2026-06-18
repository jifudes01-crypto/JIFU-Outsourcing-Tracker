export const APP_NAME = "吉富發包紀錄管理系統";
export const APP_NAME_EN = "JIFU Outsourcing Tracker";
export const COMPANY_NAME = "吉富工商地產有限公司";
export const INVOICE_BUCKET = "invoices";
export const REMITTANCE_BUCKET = "remittances";

export const roles = ["super_admin", "admin", "manager", "staff", "viewer"] as const;
export const orderStatuses = ["發包中", "製作中", "已完成", "取消"] as const;
export const paymentStatuses = ["未付款", "已付款", "部分付款", "不需付款"] as const;
export const paymentMethods = ["現金", "匯款", "支票", "信用卡", "其他"] as const;
export const defaultCategories = ["印刷", "輸出", "設計", "攝影", "廣告", "耗材", "其他"];

export const navItems = [
  { href: "/dashboard", label: "總覽看板" },
  { href: "/orders", label: "發包紀錄" },
  { href: "/orders/new", label: "新增發包紀錄" },
  { href: "/reports", label: "報表分析" },
  { href: "/vendors", label: "廠商管理" },
  { href: "/categories", label: "類別管理" },
  { href: "/payments", label: "付款管理" },
  { href: "/attachments", label: "附件管理" },
  { href: "/my-orders", label: "我的發包紀錄" },
  { href: "/users", label: "使用者管理" },
  { href: "/roles", label: "角色權限" },
  { href: "/audit-logs", label: "操作紀錄" },
  { href: "/settings", label: "系統設定" }
] as const;
