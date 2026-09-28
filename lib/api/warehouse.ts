import { supabase } from "@/lib/supabase";
import { Order, OrderRow, UserRow } from "@/lib/types";

export interface FetchWarehouseOrdersOptions {
  startDate?: string;
  endDate?: string;
  filterMerchant?: string | null;
  page?: number;
  pageSize?: number;
}

export interface FetchWarehouseOrdersResult {
  data: Order[];
  count: number | null;
}

/**
 * Warehouse Dashboard Data Fetching API
 */

/**
 * Fetch orders for the main Warehouse queue (excluding out-of-stock items)
 */
export async function fetchWarehouseOrders(
  options: FetchWarehouseOrdersOptions = {}
): Promise<FetchWarehouseOrdersResult> {
  if (!supabase) return { data: [], count: 0 };

  const { startDate, endDate, filterMerchant, page = 0, pageSize = 100 } = options;

  let query = supabase.from("orders").select(
    "id, created_at, customer_name, delivery_address, phone_numbers, merchant, items, total_amount, inventory_status, wh_delivery_status, fom_assigned, warehouse_comment, cc_comment, extracted_by, status, prints",
    { count: "exact" }
  );

  if (startDate) {
    query = query.gte("created_at", `${startDate}T00:00:00Z`);
  }
  if (endDate) {
    query = query.lte("created_at", `${endDate}T23:59:59Z`);
  }

  query = query
    .neq("inventory_status", "out-of-stock")
    .or("status.eq.customer_service,fom_assigned.is.null");

  if (filterMerchant) {
    query = query.eq("merchant", filterMerchant);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching Warehouse orders:", error);
    throw error;
  }

  return {
    data: (data as unknown as Order[]) || [],
    count: count ?? 0,
  };
}

/**
 * Fetch out-of-stock orders for the Warehouse dashboard
 */
export async function fetchOutOfStockOrders(
  options: FetchWarehouseOrdersOptions = {}
): Promise<FetchWarehouseOrdersResult> {
  if (!supabase) return { data: [], count: 0 };

  const { startDate, endDate, filterMerchant, page = 0, pageSize = 100 } = options;

  let query = supabase.from("orders").select(
    "id, created_at, customer_name, delivery_address, phone_numbers, merchant, items, total_amount, inventory_status, wh_delivery_status, fom_assigned, warehouse_comment, cc_comment, extracted_by, status, prints",
    { count: "exact" }
  );

  if (startDate) {
    query = query.gte("created_at", `${startDate}T00:00:00Z`);
  }
  if (endDate) {
    query = query.lte("created_at", `${endDate}T23:59:59Z`);
  }

  query = query.eq("inventory_status", "out-of-stock");

  if (filterMerchant) {
    query = query.eq("merchant", filterMerchant);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching out-of-stock orders:", error);
    throw error;
  }

  return {
    data: (data as unknown as Order[]) || [],
    count: count ?? 0,
  };
}

/**
 * Fetch Warehouse department team members
 */
export async function fetchWarehouseUsers(): Promise<
  Pick<UserRow, "id" | "display_name">[]
> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("users")
    .select("id, display_name")
    .eq("role", "warehouse");

  if (error) {
    console.error("Error fetching Warehouse users:", error);
    throw error;
  }
  return data || [];
}

/**
 * Update an order from the Warehouse dashboard (e.g., inventory status, prints)
 */
export async function updateWarehouseOrder(
  id: string,
  updates: Partial<OrderRow>
): Promise<OrderRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating Warehouse order:", error);
    throw error;
  }
  return data;
}
