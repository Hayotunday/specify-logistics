// json values supported by PostgreSQL json and jsonb columns.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// enum values declared in sql/db.sql.
export type DeliveryStatus =
  | "delivered"
  | "canceled"
  | "returned"
  | "pending"
  | "shipped"
  | "failed";

export type InventoryStatus = "packed" | "unpacked" | "out-of-stock";
export type RiderType = "in-house" | "external";

export type UserRole =
  | "customer_service"
  | "warehouse"
  | "fom"
  | "accounting"
  | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  customer_service: "Customer Service",
  warehouse: "Warehouse",
  fom: "FOM",
  accounting: "Accounting",
  admin: "Administrator",
};

// Retain the existing domain name for order delivery status.
export type OrderDeliveryStatus = DeliveryStatus;

// Database row types mirror the columns and nullability declared in sql/db.sql.
export interface CustomerInquiryRow {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  subject: string | null;
  message: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LandmarkRow {
  id: string;
  name: string | null;
  price: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MerchantAccessKeyRow {
  id: string;
  role: string | null;
  access_key: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MerchantRow {
  id: string;
  name: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  approval_status: string | null;
  submitted_by_role: string | null;
  submitted_by: string | null;
  admin_approved: string | null;
  warehouse_approved: string | null;
  customer_service_approved: string | null;
}

export interface OrderRow {
  id: string;
  customer_name: string | null;
  delivery_address: string | null;
  phone_numbers: Json | null;
  merchant: string | null;
  cc_comment: string | null;
  items: Json | null;
  total_amount: number | null;
  wh_comment: string | null;
  inventory_status: InventoryStatus | null;
  fom_assigned: string | null;
  fom_assigned_at: string | null;
  fom_comment: string | null;
  rider_assigned_at: string | null;
  rider: string | null;
  landmark: string | null;
  payment_to_rider: number | null;
  payment_method: string | null;
  payment_to_merchant: number | null;
  payment_confirmed: boolean | null;
  bank: string | null;
  extracted_by: string | null;
  wh_delivery_status: DeliveryStatus | null;
  fom_delivery_status: DeliveryStatus | null;
  status: UserRole | null;
  payment_verified_at: string | null;
  quantity_delivered: number | null;
  amount_paid: number | null;
  created_at: string | null;
  updated_at: string | null;
  delivered_at: string | null;
  prints: number | null;
}

export interface ProductRow {
  id: string;
  merchant_id: string | null;
  name: string | null;
  price: number | null;
  created_at: string | null;
  updated_at: string | null;
  approval_status: string | null;
  submitted_by_role: string | null;
  submitted_by: string | null;
  admin_approved: string | null;
  warehouse_approved: string | null;
  customer_service_approved: string | null;
}

export interface RiderRow {
  id: string;
  name: string | null;
  phone: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  rider_type: RiderType | null;
}

export interface SettingRow {
  key: string;
  value: string | null;
  updated_at: string | null;
}

export interface StockEntryRow {
  id: string;
  merchant_id: string | null;
  product_id: string | null;
  quantity: number | null;
  notes: string | null;
  status: string | null;
  submitted_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  submitted_by_role: string | null;
  admin_approved: string | null;
  warehouse_approved: string | null;
  customer_service_approved: string | null;
}

export interface UserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  last_login: string | null;
  role: UserRole | null;
  is_deleted: boolean | null;
}

type TableDefinition<Row, RequiredInsertKeys extends keyof Row = never> = {
  Row: Row;
  Insert: Pick<Row, RequiredInsertKeys> &
    Partial<Omit<Row, RequiredInsertKeys>>;
  Update: Partial<Row>;
  Relationships: [];
};

// Supabase database schema shape, suitable for typing createClient<Database>().
export interface Database {
  public: {
    Tables: {
      customer_inquiries: TableDefinition<CustomerInquiryRow, "id">;
      landmarks: TableDefinition<LandmarkRow, "id">;
      merchant_access_keys: TableDefinition<MerchantAccessKeyRow, "id">;
      merchants: TableDefinition<MerchantRow, "id">;
      orders: TableDefinition<OrderRow, "id">;
      products: TableDefinition<ProductRow, "id">;
      riders: TableDefinition<RiderRow, "id">;
      settings: TableDefinition<SettingRow, "key">;
      stock_entries: TableDefinition<StockEntryRow, "id">;
      users: TableDefinition<UserRow, "id">;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      delivery_status: DeliveryStatus;
      inventory_status: InventoryStatus;
      rider_type: RiderType;
      role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Application auth profile mapped from a users table row.
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface AuthUser extends UserProfile {
  isLoading: boolean;
  error: string | null;
}

// Structured item shape used by order entry and Gemini extraction.
export interface OrderItem {
  name: string;
  quantity: number;
  weight?: number;
  dimensions?: string;
}

// Application order view; OrderRow above preserves the exact database nullability.
export interface Order {
  id: string;
  customer_name: string;
  delivery_address?: string | null;
  phone_numbers?: string[] | null;
  merchant?: string | null;
  cc_comment?: string | null;
  items: OrderItem[];
  total_amount: number;
  status: UserRole;
  inventory_status?: InventoryStatus | null;
  wh_delivery_status?: DeliveryStatus | null;
  fom_delivery_status?: DeliveryStatus | null;
  wh_comment?: string | null;
  warehouse_comment?: string | null;
  fom_assigned?: string | null;
  fom_assigned_at?: string | null;
  fom_comment?: string | null;
  rider?: string | null;
  rider_name?: string | null;
  rider_assigned_at?: string | null;
  landmark?: string | null;
  payment_to_rider?: number | null;
  payment_method?: string | null;
  payment_to_merchant?: number | null;
  payment_confirmed?: boolean | null;
  bank?: string | null;
  extracted_by?: string | null;
  payment_verified_at?: string | null;
  quantity_delivered?: number | null;
  amount_paid?: number | null;
  created_at: string;
  updated_at?: string | null;
  delivered_at?: string | null;
  prints?: number | null;
}

export interface ExtractedOrder {
  customerName: string;
  deliveryAddress?: string | null;
  phoneNumbers?: string[] | null;
  merchant?: string | null;
  comment?: string | null;
  items: OrderItem[];
  totalAmount: number;
}

export type GeminiResponse =
  | { success: true; data: ExtractedOrder }
  | { success: false; error: string };
