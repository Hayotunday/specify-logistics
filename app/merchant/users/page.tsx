"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Edit2, Eye, EyeOff, Loader2, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useMerchantSession } from "@/components/merchant-session-provider";

const allowedNormalRoles = ["admin", "warehouse", "customer_service"];
const merchantRoles = ["admin", "warehouse", "customer_service"] as const;

export default function MerchantUsersPage() {
  const { role } = useMerchantSession();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [accessRows, setAccessRows] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] =
    useState<(typeof merchantRoles)[number]>("warehouse");
  const [accessKey, setAccessKey] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: userData }, { data: accessData }] = await Promise.all([
        supabase!
          .from("users")
          .select("id, email, display_name, role, is_active, is_deleted")
          .in("role", allowedNormalRoles)
          .eq("is_active", true)
          .eq("is_deleted", false)
          .order("display_name"),
        supabase!
          .from("merchant_access_keys")
          .select("id, role, access_key, users(id, email, display_name, role)")
          .order("role"),
      ]);

      setUsers(userData ?? []);
      setAccessRows(accessData ?? []);
    } catch {
      toast.error("Failed to load merchant dashboard users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const availableUsers = useMemo(() => {
    const granted = new Set(accessRows.map((row) => `${row.id}:${row.role}`));
    return users.filter((user) => !granted.has(`${user.id}:${selectedRole}`));
  }, [accessRows, selectedRole, users]);

  const grantAccess = async () => {
    if (!selectedUserId || !accessKey.trim()) {
      toast.error("Select a user and enter an access key.");
      return;
    }

    setSaving(true);
    try {
      console.log({
        id: selectedUserId,
        role: selectedRole,
        access_key: accessKey.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      const { error } = await supabase!.from("merchant_access_keys").insert({
        id: selectedUserId,
        role: selectedRole,
        access_key: accessKey.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("Merchant dashboard access granted.");
      setSelectedUserId("");
      setAccessKey("");
      fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to grant access.",
      );
    } finally {
      setSaving(false);
    }
  };

  const updateAccessKey = async (row: any) => {
    if (!editingKey.trim()) {
      toast.error("Access key cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase!
        .from("merchant_access_keys")
        .update({ access_key: editingKey.trim() })
        .eq("id", row.id)
        .eq("role", row.role);

      if (error) throw error;
      toast.success("Access key updated.");
      setEditingId(null);
      setEditingKey("");
      fetchData();
    } catch {
      toast.error("Failed to update access key.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccess = async (row: any) => {
    setSaving(true);
    try {
      const { error } = await supabase!
        .from("merchant_access_keys")
        .delete()
        .eq("id", row.id)
        .eq("role", row.role);

      if (error) throw error;
      toast.success("Merchant dashboard access removed.");
      fetchData();
    } catch {
      toast.error("Failed to remove access.");
    } finally {
      setSaving(false);
    }
  };

  if (role !== "admin") {
    return (
      <div className="p-12 text-center text-slate-500">
        You do not have permission to manage merchant dashboard users.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">User Access</h1>
        <p className="mt-2 text-sm text-slate-500">
          Grant merchant dashboard privileges to admin, warehouse, and customer
          service users from the main dashboard.
        </p>
      </div>

      <Card className="space-y-4 border-0 p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Grant Access</h2>
        <div className="grid gap-4 md:grid-cols-[1fr_180px_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label>User</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
            >
              <option value="">Select user</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.display_name || user.email} ({user.role})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Merchant Role</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedRole}
              onChange={(event) =>
                setSelectedRole(event.target.value as typeof selectedRole)
              }
            >
              {merchantRoles.map((item) => (
                <option key={item} value={item}>
                  {item.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Access Key</Label>
            <Input
              value={accessKey}
              onChange={(event) => setAccessKey(event.target.value)}
              placeholder="Enter access key"
            />
          </div>
          <Button onClick={grantAccess} disabled={saving}>
            <UserPlus className="mr-2 h-4 w-4" />
            Grant
          </Button>
        </div>
      </Card>

      <Card className="border-0 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Current Access</h2>
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          </div>
        ) : accessRows.length === 0 ? (
          <p className="text-sm text-slate-500">
            No merchant access users yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-slate-500">
                    User
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-500">
                    Role
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-500">
                    Access Key
                  </th>
                  <th className="p-3 text-right text-xs font-semibold text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {accessRows.map((row) => {
                  const editKey = `${row.id}:${row.role}`;
                  const isEditing = editingId === editKey;
                  return (
                    <tr key={editKey} className="border-t">
                      <td className="p-3">
                        <p className="font-medium">
                          {row.users?.display_name ||
                            row.users?.email ||
                            row.id}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.users?.email}
                        </p>
                      </td>
                      <td className="p-3 capitalize">
                        {row.role.replace("_", " ")}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <Input
                            value={editingKey}
                            onChange={(event) =>
                              setEditingKey(event.target.value)
                            }
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {showKeyMap[editKey]
                                ? row.access_key
                                : "•".repeat(
                                    Math.min(row.access_key?.length ?? 8, 12),
                                  )}
                            </span>
                            <button
                              onClick={() =>
                                setShowKeyMap((prev) => ({
                                  ...prev,
                                  [editKey]: !prev[editKey],
                                }))
                              }
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                              aria-label={showKeyMap[editKey] ? "Hide key" : "Show key"}
                            >
                              {showKeyMap[editKey] ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => updateAccessKey(row)}
                                disabled={saving}
                              >
                                <Check className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                                disabled={saving}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {/* Change access key — admin only */}
                              {role === "admin" && (
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  title="Change access key"
                                  onClick={() => {
                                    setEditingId(editKey);
                                    setEditingKey(row.access_key || "");
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => deleteAccess(row)}
                                disabled={saving}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
