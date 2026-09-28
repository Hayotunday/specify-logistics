import { supabase } from "@/lib/supabase";
import { Order, OrderRow, RiderRow } from "@/lib/types";

export interface FetchAccountingOptions {
  startDate?: string;
  endDate?: string;
  filterMerchant?: string | null;
  page?: number;
  pageSize?: number;
}

export interface FetchAccountingResult {
  data: Order[];
  count: number | null;
}

/**
 * Accounting Dashboard Data Fetching API
 */

/**
 * Fetch orders for financial payments verification & reconciliation
 */
export async function fetchAccountingPayments(
  options: FetchAccountingOptions = {}
): Promise<FetchAccountingResult> {
  if (!supabase) return { data: [], count: 0 };

  const { startDate, endDate, filterMerchant, page = 0, pageSize = 100 } = options;

  let query = supabase.from("orders").select(
    "id, created_at, customer_name, delivery_address, items, total_amount, payment_method, bank, quantity_delivered, amount_paid, payment_confirmed, payment_verified_at, payment_to_merchant, merchant",
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
    console.error("Error fetching accounting payments:", error);
    throw error;
  }

  return {
    data: (data as unknown as Order[]) || [],
    count: count ?? 0,
  };
}

/**
 * Fetch rider payments data along with rider metadata for reconciliation
 */
export async function fetchRiderPayments(
  options: FetchAccountingOptions = {}
): Promise<FetchAccountingResult & { riders: RiderRow[] }> {
  if (!supabase) return { data: [], count: 0, riders: [] };

  const { startDate, endDate, filterMerchant, page = 0, pageSize = 100 } = options;

  let ordersQuery = supabase.from("orders").select(
    "id, created_at, customer_name, delivery_address, items, total_amount, rider_name, payment_to_rider, rider_assigned_at, fom_delivery_status, status, merchant",
    { count: "exact" }
  );

  if (startDate) {
    ordersQuery = ordersQuery.gte("created_at", `${startDate}T00:00:00Z`);
  }
  if (endDate) {
    ordersQuery = ordersQuery.lte("created_at", `${endDate}T23:59:59Z`);
  }
  if (filterMerchant) {
    ordersQuery = ordersQuery.eq("merchant", filterMerchant);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const [ordersRes, ridersRes] = await Promise.all([
    ordersQuery.order("created_at", { ascending: false }).range(from, to),
    supabase.from("riders").select("*").eq("is_active", true),
  ]);

  if (ordersRes.error) {
    console.error("Error fetching rider payments:", ordersRes.error);
    throw ordersRes.error;
  }

  return {
    data: (ordersRes.data as unknown as Order[]) || [],
    count: ordersRes.count ?? 0,
    riders: ridersRes.data || [],
  };
}

/**
 * Fetch orders for merchant invoicing
 */
export async function fetchAccountingInvoices(
  options: FetchAccountingOptions = {}
): Promise<Order[]> {
  if (!supabase) return [];

  const { startDate, endDate, filterMerchant } = options;

  let query = supabase.from("orders").select("*");

  if (startDate) {
    query = query.gte("created_at", `${startDate}T00:00:00Z`);
  }
  if (endDate) {
    query = query.lte("created_at", `${endDate}T23:59:59Z`);
  }
  if (filterMerchant) {
    query = query.eq("merchant", filterMerchant);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching accounting invoices:", error);
    throw error;
  }

  return (data as unknown as Order[]) || [];
}

/**
 * Verify or update payment confirmation for an order
 */
export async function verifyOrderPayment(
  orderId: string,
  paymentConfirmed: boolean,
  amountPaid?: number,
  bank?: string,
  paymentMethod?: string
): Promise<OrderRow | null> {
  if (!supabase) return null;

  const updates: Partial<OrderRow> = {
    payment_confirmed: paymentConfirmed,
    payment_verified_at: paymentConfirmed ? new Date().toISOString() : null,
  };

  if (amountPaid !== undefined) updates.amount_paid = amountPaid;
  if (bank !== undefined) updates.bank = bank;
  if (paymentMethod !== undefined) updates.payment_method = paymentMethod;

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    console.error("Error verifying order payment:", error);
    throw error;
  }

  return data;
}
