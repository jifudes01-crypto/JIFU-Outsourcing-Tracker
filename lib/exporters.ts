"use client";

import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { COMPANY_NAME } from "@/lib/constants";
import type { OutsourceOrder } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function exportOrdersToExcel(orders: OutsourceOrder[], fileName = "發包紀錄.xlsx") {
  const rows = orders.map((order) => ({
    發包日期: order.order_date,
    廠商: order.vendor_name,
    需求人: order.requester,
    製作內容: order.item_name,
    類別: order.category,
    數量: order.quantity,
    單價: order.unit_price,
    總價: order.total_price,
    狀態: order.status,
    付款狀態: order.payment_status,
    付款日期: order.payment_date,
    付款方式: order.payment_method,
    建立者: order.creator_name,
    "發票 / 收據連結": order.invoice_file_url,
    匯款紀錄連結: order.remittance_file_url,
    備註: order.note
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "發包紀錄");
  XLSX.writeFile(workbook, fileName);
}

export function exportOrdersToPdf(
  orders: OutsourceOrder[],
  reportName = "發包紀錄列表報表",
  exportedBy = "系統使用者"
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const total = orders.reduce((sum, item) => sum + Number(item.total_price ?? 0), 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(COMPANY_NAME, 40, 40);
  doc.setFontSize(12);
  doc.text(reportName, 40, 64);
  doc.setFont("helvetica", "normal");
  doc.text(`匯出日期：${new Date().toLocaleDateString("zh-TW")}`, 40, 86);
  doc.text(`匯出人：${exportedBy}`, 220, 86);
  doc.text(`統計金額：${formatCurrency(total)}`, 400, 86);
  let y = 120;
  doc.setFont("helvetica", "bold");
  doc.text("日期", 40, y);
  doc.text("廠商", 110, y);
  doc.text("內容", 250, y);
  doc.text("類別", 430, y);
  doc.text("付款", 500, y);
  doc.text("總價", 580, y);
  doc.setFont("helvetica", "normal");
  orders.slice(0, 22).forEach((order) => {
    y += 22;
    doc.text(order.order_date ?? "", 40, y);
    doc.text(String(order.vendor_name ?? "").slice(0, 14), 110, y);
    doc.text(String(order.item_name ?? "").slice(0, 20), 250, y);
    doc.text(String(order.category ?? ""), 430, y);
    doc.text(String(order.payment_status ?? ""), 500, y);
    doc.text(formatCurrency(order.total_price), 580, y);
  });
  doc.save(`${reportName}.pdf`);
}
