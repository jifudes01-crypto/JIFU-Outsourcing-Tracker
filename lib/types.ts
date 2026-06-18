export type Role = "super_admin" | "admin" | "manager" | "staff" | "viewer";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Vendor = {
  id: string;
  vendor_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  category_name: string;
  sort_order: number;
  created_at: string;
};

export type OutsourceOrder = {
  id: string;
  order_date: string;
  vendor_id: string | null;
  vendor_name: string | null;
  requester: string | null;
  creator_id: string | null;
  creator_name: string | null;
  item_name: string;
  category: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  payment_status: string;
  payment_date: string | null;
  payment_method: string | null;
  payment_note: string | null;
  invoice_file_url: string | null;
  invoice_file_name: string | null;
  remittance_file_url: string | null;
  remittance_file_name: string | null;
  note: string | null;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  order_id: string | null;
  action: string;
  user_id: string | null;
  user_name: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
};

export type ImportLog = {
  id: string;
  file_name: string | null;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  imported_by: string | null;
  imported_by_name: string | null;
  created_at: string;
};

export type OrderFormValues = Omit<
  OutsourceOrder,
  "id" | "created_at" | "updated_at" | "version"
> & {
  version?: number;
};
