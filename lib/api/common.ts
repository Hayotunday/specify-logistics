import { supabase } from "@/lib/supabase";
import { LandmarkRow, RiderRow, Order, RiderType } from "@/lib/types";

/**
 * Common / Shared Data Fetching API
 */

/**
 * Fetch landmarks list from database
 */
export async function fetchLandmarks(): Promise<LandmarkRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("landmarks")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching landmarks:", error);
    throw error;
  }
  return data || [];
}

/**
 * Create a new landmark
 */
export async function createLandmark(
  name: string,
  price: number
): Promise<LandmarkRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("landmarks")
    .insert([{ name, price, is_active: true }])
    .select()
    .single();

  if (error) {
    console.error("Error creating landmark:", error);
    throw error;
  }
  return data;
}

/**
 * Update an existing landmark
 */
export async function updateLandmark(
  id: string,
  updates: Partial<LandmarkRow>
): Promise<LandmarkRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("landmarks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating landmark:", error);
    throw error;
  }
  return data;
}

/**
 * Delete a landmark
 */
export async function deleteLandmark(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("landmarks").delete().eq("id", id);
  if (error) {
    console.error("Error deleting landmark:", error);
    throw error;
  }
}

/**
 * Fetch riders list from database
 */
export async function fetchRiders(activeOnly = true): Promise<RiderRow[]> {
  if (!supabase) return [];
  let query = supabase.from("riders").select("*").order("name");

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching riders:", error);
    throw error;
  }
  return data || [];
}

/**
 * Create a new rider
 */
export async function createRider(
  name: string,
  phone: string,
  riderType: RiderType = "external"
): Promise<RiderRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("riders")
    .insert([{ name, phone, rider_type: riderType, is_active: true }])
    .select()
    .single();

  if (error) {
    console.error("Error creating rider:", error);
    throw error;
  }
  return data;
}

/**
 * Update a rider
 */
export async function updateRider(
  id: string,
  updates: Partial<RiderRow>
): Promise<RiderRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("riders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating rider:", error);
    throw error;
  }
  return data;
}

/**
 * Delete a rider
 */
export async function deleteRider(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("riders").delete().eq("id", id);
  if (error) {
    console.error("Error deleting rider:", error);
    throw error;
  }
}

/**
 * Fetch global system metrics/statistics via RPC
 */
export async function fetchGlobalStats(): Promise<Record<string, number>> {
  if (!supabase) return {};
  const { data, error } = await supabase.rpc("get_global_stats", {});
  if (error) {
    console.error("Error fetching global stats:", error);
    throw error;
  }
  return (data as Record<string, number>) || {};
}

/**
 * Fetch orders and landmark prices for export (CSV/XLSX)
 */
export async function fetchExportOrders(
  startDate?: Date,
  endDate?: Date
): Promise<{ data: Order[] | null; fetchError: any; landmarks: LandmarkRow[] }> {
  if (!supabase) {
    return { data: [], fetchError: null, landmarks: [] };
  }

  let query = supabase
    .from("orders")
    .select(
      "id, created_at, customer_name, phone_numbers, delivery_address, items, total_amount, merchant, inventory_status, wh_delivery_status, fom_assigned, fom_assigned_at, rider_name, payment_to_rider, rider_assigned_at, fom_delivery_status, landmark, payment_method, bank, quantity_delivered, amount_paid, payment_confirmed, payment_verified_at, payment_to_merchant, cc_comment, warehouse_comment, fom_comment, extracted_by"
    );

  if (startDate) {
    query = query.gte("created_at", startDate.toISOString());
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query = query.lte("created_at", end.toISOString());
  }

  const { data, error: fetchError } = await query
    .order("created_at", { ascending: false })
    .limit(10000);

  const { data: landmarksData } = await supabase
    .from("landmarks")
    .select("*");

  return {
    data: (data as unknown as Order[]) || null,
    fetchError,
    landmarks: landmarksData || [],
  };
}

/**
 * Fetch a single order for public tracking by Order ID, partial UUID prefix, or phone number
 */
export async function fetchTrackedOrder(
  searchQuery: string
): Promise<Order | null> {
  if (!supabase || !searchQuery.trim()) return null;

  const cleanQuery = searchQuery.trim().replace("#", "");

  // Try exact ID match first
  let { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", cleanQuery)
    .maybeSingle();

  if (data) {
    return data as unknown as Order;
  }

  // If not found, try prefix match on id (e.g., first 8 chars of UUID)
  const { data: prefixMatch } = await supabase
    .from("orders")
    .select("*")
    .ilike("id", `${cleanQuery}%`)
    .limit(1);

  if (prefixMatch && prefixMatch.length > 0) {
    return prefixMatch[0] as unknown as Order;
  }

  return null;
}

