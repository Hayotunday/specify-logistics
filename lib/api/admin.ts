import { supabase } from "@/lib/supabase";
import { UserRow, UserRole, SettingRow } from "@/lib/types";

/**
 * Admin Dashboard & System Management Data Fetching API
 */

/**
 * Fetch all users (including active and soft-deleted) for Admin User Management
 */
export async function fetchAdminUsers(): Promise<UserRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin users:", error);
    throw error;
  }
  return (data as UserRow[]) || [];
}

/**
 * Create a new user profile entry in the database
 */
export async function createAdminUser(
  userData: Partial<UserRow>
): Promise<UserRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("users")
    .insert([userData as any])
    .select()
    .single();

  if (error) {
    console.error("Error creating user:", error);
    throw error;
  }
  return data;
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<UserRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
  return data;
}

/**
 * Update user active status
 */
export async function updateUserStatus(
  userId: string,
  isActive: boolean
): Promise<UserRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("users")
    .update({ is_active: isActive })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
  return data;
}

/**
 * Soft delete a user
 */
export async function softDeleteUser(userId: string): Promise<UserRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("users")
    .update({ is_deleted: true, is_active: false })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error soft deleting user:", error);
    throw error;
  }
  return data;
}

/**
 * Restore a soft-deleted user
 */
export async function restoreUser(userId: string): Promise<UserRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("users")
    .update({ is_deleted: false, is_active: true })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error restoring user:", error);
    throw error;
  }
  return data;
}

/**
 * Fetch system settings
 */
export async function fetchAdminSettings(): Promise<SettingRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("settings").select("*");

  if (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
  return data || [];
}

/**
 * Upsert a system setting key-value pair
 */
export async function updateSetting(
  key: string,
  value: string
): Promise<SettingRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.error("Error updating setting:", error);
    throw error;
  }
  return data;
}
