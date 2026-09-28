import { supabase } from "@/lib/supabase";
import { Order, OrderRow, UserRow, CustomerInquiryRow } from "@/lib/types";

export interface FetchCSOrdersOptions {
  startDate?: string;
  endDate?: string;
  filterMerchant?: string | null;
  page?: number;
  pageSize?: number;
}

export interface FetchCSOrdersResult {
  data: Order[];
  count: number | null;
}

/**
 * Customer Service Dashboard Data Fetching API
 */

/**
 * Fetch orders for the Customer Service dashboard with pagination and filtering
 */
export async function fetchCustomerServiceOrders(
  options: FetchCSOrdersOptions = {}
): Promise<FetchCSOrdersResult> {
  if (!supabase) return { data: [], count: 0 };

  const { startDate, endDate, filterMerchant, page = 0, pageSize = 100 } = options;

  let query = supabase.from("orders").select(
    "id, created_at, customer_name, delivery_address, phone_numbers, merchant, items, total_amount, cc_comment, fom_delivery_status, extracted_by, status",
    { count: "exact" }
  );

  if (startDate) {
    query = query.gte("created_at", `${startDate}T00:00:00Z`);
  }
  if (endDate) {
    query = query.lte("created_at", `${endDate}T23:59:59Z`);
  }
  if (filterMerchant) {
    query = query.eq("merchant", filterMerchant);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching Customer Service orders:", error);
    throw error;
  }

  return {
    data: (data as unknown as Order[]) || [],
    count: count ?? 0,
  };
}

/**
 * Fetch Customer Service department team members
 */
export async function fetchCustomerServiceUsers(): Promise<
  Pick<UserRow, "id" | "display_name">[]
> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("users")
    .select("id, display_name")
    .eq("role", "customer_service");

  if (error) {
    console.error("Error fetching CS users:", error);
    throw error;
  }
  return data || [];
}

/**
 * Create a new order (from Customer Service form or AI Extraction)
 */
export async function createOrder(
  orderData: Partial<OrderRow>
): Promise<OrderRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("orders")
    .insert([orderData as any])
    .select()
    .single();

  if (error) {
    console.error("Error creating order:", error);
    throw error;
  }
  return data;
}

/**
 * Update an order from Customer Service
 */
export async function updateCustomerServiceOrder(
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
    console.error("Error updating CS order:", error);
    throw error;
  }
  return data;
}

/**
 * Fetch customer inquiries for Customer Service
 */
export async function fetchCustomerInquiries(): Promise<CustomerInquiryRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("customer_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customer inquiries:", error);
    throw error;
  }
  return data || [];
}
