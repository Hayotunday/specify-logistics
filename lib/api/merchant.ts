import { supabase } from "@/lib/supabase";
import {
  MerchantRow,
  ProductRow,
  StockEntryRow,
  MerchantAccessKeyRow,
} from "@/lib/types";

/**
 * Merchant Portal & Inventory Management Data Fetching API
 */

/**
 * Fetch merchants list
 */
export async function fetchMerchants(
  activeOnly = false
): Promise<MerchantRow[]> {
  if (!supabase) return [];
  let query = supabase.from("merchants").select("*").order("name");

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching merchants:", error);
    throw error;
  }
  return data || [];
}

/**
 * Create a new merchant
 */
export async function createMerchant(
  name: string,
  submittedByRole?: string,
  submittedBy?: string
): Promise<MerchantRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("merchants")
    .insert([
      {
        name,
        is_active: true,
        approval_status: "pending",
        submitted_by_role: submittedByRole,
        submitted_by: submittedBy,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating merchant:", error);
    throw error;
  }
  return data;
}

/**
 * Update merchant details
 */
export async function updateMerchant(
  id: string,
  updates: Partial<MerchantRow>
): Promise<MerchantRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("merchants")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating merchant:", error);
    throw error;
  }
  return data;
}

/**
 * Delete a merchant permanently
 */
export async function deleteMerchant(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("merchants").delete().eq("id", id);
  if (error) {
    console.error("Error deleting merchant:", error);
    throw error;
  }
}

/**
 * Fetch products list, optionally filtered by merchant ID
 */
export async function fetchProducts(merchantId?: string): Promise<ProductRow[]> {
  if (!supabase) return [];
  let query = supabase.from("products").select("*").order("name");

  if (merchantId) {
    query = query.eq("merchant_id", merchantId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
  return data || [];
}

/**
 * Create a new product for a merchant
 */
export async function createProduct(
  merchantId: string,
  name: string,
  price: number,
  submittedByRole?: string,
  submittedBy?: string
): Promise<ProductRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        merchant_id: merchantId,
        name,
        price,
        approval_status: "pending",
        submitted_by_role: submittedByRole,
        submitted_by: submittedBy,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    throw error;
  }
  return data;
}

/**
 * Update product details
 */
export async function updateProduct(
  id: string,
  updates: Partial<ProductRow>
): Promise<ProductRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating product:", error);
    throw error;
  }
  return data;
}

/**
 * Fetch stock log entries
 */
export async function fetchStockEntries(
  merchantId?: string
): Promise<StockEntryRow[]> {
  if (!supabase) return [];
  let query = supabase.from("stock_entries").select("*").order("created_at", { ascending: false });

  if (merchantId) {
    query = query.eq("merchant_id", merchantId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching stock entries:", error);
    throw error;
  }
  return data || [];
}

/**
 * Submit a stock entry for a merchant product
 */
export async function createStockEntry(
  entry: Partial<StockEntryRow>
): Promise<StockEntryRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("stock_entries")
    .insert([entry as any])
    .select()
    .single();

  if (error) {
    console.error("Error creating stock entry:", error);
    throw error;
  }
  return data;
}

/**
 * Fetch merchant access keys
 */
export async function fetchMerchantAccessKeys(): Promise<
  MerchantAccessKeyRow[]
> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("merchant_access_keys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching merchant access keys:", error);
    throw error;
  }
  return data || [];
}

/**
 * Create a new merchant access key
 */
export async function createMerchantAccessKey(
  accessKey: string,
  role = "merchant"
): Promise<MerchantAccessKeyRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("merchant_access_keys")
    .insert([{ access_key: accessKey, role }])
    .select()
    .single();

  if (error) {
    console.error("Error creating merchant access key:", error);
    throw error;
  }
  return data;
}

/**
 * Fetch pending approvals for merchants, products, and stock entries
 */
export async function fetchPendingApprovals(): Promise<{
  merchants: MerchantRow[];
  products: ProductRow[];
  stockEntries: StockEntryRow[];
}> {
  if (!supabase) {
    return { merchants: [], products: [], stockEntries: [] };
  }

  const [merchantsRes, productsRes, stockRes] = await Promise.all([
    supabase
      .from("merchants")
      .select("*")
      .or("approval_status.eq.pending,admin_approved.eq.pending,warehouse_approved.eq.pending,customer_service_approved.eq.pending"),
    supabase
      .from("products")
      .select("*")
      .or("approval_status.eq.pending,admin_approved.eq.pending,warehouse_approved.eq.pending,customer_service_approved.eq.pending"),
    supabase
      .from("stock_entries")
      .select("*")
      .or("status.eq.pending,admin_approved.eq.pending,warehouse_approved.eq.pending,customer_service_approved.eq.pending"),
  ]);

  return {
    merchants: merchantsRes.data || [],
    products: productsRes.data || [],
    stockEntries: stockRes.data || [],
  };
}

/**
 * Update approval status for an item in merchants, products, or stock_entries
 */
export async function updateApprovalStatus(
  table: "merchants" | "products" | "stock_entries",
  id: string,
  updates: Record<string, string | null>
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(table).update(updates).eq("id", id);
  if (error) {
    console.error(`Error updating approval status for ${table}:`, error);
    throw error;
  }
}
