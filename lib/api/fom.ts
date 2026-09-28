import { supabase } from "@/lib/supabase";
import { Order, OrderRow, UserRow } from "@/lib/types";

export interface FetchFomOrdersOptions {
  userId: string;
  startDate?: string;
  endDate?: string;
  filterMerchant?: string | null;
  page?: number;
  pageSize?: number;
}

export interface FetchFomOrdersResult {
  data: Order[];
  count: number | null;
}

/**
 * FOM (Field Operations Manager) Dashboard Data Fetching API
 */

/**
 * Fetch pending dispatch orders assigned to a specific FOM user
 */
export async function fetchFomOrders(
  options: FetchFomOrdersOptions
): Promise<FetchFomOrdersResult> {
  if (!supabase) return { data: [], count: 0 };

  const { userId, startDate, endDate, filterMerchant, page = 0, pageSize = 100 } = options;

  let query = supabase.from("orders").select(
    "id, created_at, fom_assigned_at, customer_name, delivery_address, items, total_amount, rider_name, payment_to_rider, landmark, payment_method, fom_delivery_status, fom_comment, status, fom_assigned, inventory_status, merchant",
    { count: "exact" }
  );

  if (startDate) {
    query = query.gte("created_at", `${startDate}T00:00:00Z`);
  }
  if (endDate) {
    query = query.lte("created_at", `${endDate}T23:59:59Z`);
  }

  query = query
    .eq("fom_assigned", userId)
    .eq("status", "warehouse")
    .is("rider_name", null)
    .neq("inventory_status", "out-of-stock")
    .or("fom_delivery_status.is.null,fom_delivery_status.eq.pending");

  if (filterMerchant) {
    query = query.eq("merchant", filterMerchant);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching FOM orders:", error);
    throw error;
  }

  return {
    data: (data as unknown as Order[]) || [],
    count: count ?? 0,
  };
}

/**
 * Fetch orders where a rider has been assigned by the FOM
 */
export async function fetchFomAssignedOrders(
  options: FetchFomOrdersOptions
): Promise<FetchFomOrdersResult> {
  if (!supabase) return { data: [], count: 0 };

  const { userId, startDate, endDate, filterMerchant, page = 0, pageSize = 100 } = options;

  let query = supabase.from("orders").select(
    "id, created_at, fom_assigned_at, customer_name, delivery_address, items, total_amount, rider_name, payment_to_rider, landmark, payment_method, fom_delivery_status, fom_comment, status, fom_assigned, inventory_status, merchant",
    { count: "exact" }
  );

  if (startDate) {
    query = query.gte("created_at", `${startDate}T00:00:00Z`);
  }
  if (endDate) {
    query = query.lte("created_at", `${endDate}T23:59:59Z`);
  }

  query = query
    .eq("fom_assigned", userId)
    .not("rider_name", "is", null);

  if (filterMerchant) {
    query = query.eq("merchant", filterMerchant);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching FOM assigned orders:", error);
    throw error;
  }

  return {
    data: (data as unknown as Order[]) || [],
    count: count ?? 0,
  };
}

/**
 * Fetch FOM team members
 */
export async function fetchFomUsers(): Promise<
  Pick<UserRow, "id" | "display_name">[]
> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("users")
    .select("id, display_name")
    .eq("role", "fom");

  if (error) {
    console.error("Error fetching FOM users:", error);
    throw error;
  }
  return data || [];
}

/**
 * Assign a rider to an order by an FOM
 */
export async function assignRiderToOrder(
  orderId: string,
  riderName: string,
  paymentToRider: number,
  landmark?: string
): Promise<OrderRow | null> {
  if (!supabase) return null;
  const now = new Date().toISOString();
  const updates: Partial<OrderRow> = {
    rider: riderName,
    rider_assigned_at: now,
    payment_to_rider: paymentToRider,
  };
  if (landmark) {
    updates.landmark = landmark;
  }

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    console.error("Error assigning rider to order:", error);
    throw error;
  }
  return data;
}

/**
 * Update an FOM order status or notes
 */
export async function updateFomOrder(
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
    console.error("Error updating FOM order:", error);
    throw error;
  }
  return data;
}
