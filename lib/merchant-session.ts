"use client";

import { supabase } from "@/lib/supabase";

export const MERCHANT_ROLES = [
  "admin",
  "warehouse",
  "customer_service",
  "guest",
] as const;

export type MerchantRole = (typeof MERCHANT_ROLES)[number];

type MerchantSessionResponse = {
  normalDashboardSession: boolean;
  role: MerchantRole | null;
};

const getAccessToken = async () => {
  const { data } = await supabase!.auth.getSession();
  return data.session?.access_token ?? null;
};

const requestMerchantSession = async (
  method: "GET" | "POST" | "DELETE",
  body?: Record<string, string>,
): Promise<MerchantSessionResponse> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/merchant/session", {
    method,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = (await response.json()) as MerchantSessionResponse & {
    error?: string;
  };
  if (!response.ok) throw new Error(data.error || "Unable to verify merchant access.");
  return data;
};

export const getMerchantSession = () => requestMerchantSession("GET");

export const createMerchantSession = (role: MerchantRole, accessKey: string) =>
  requestMerchantSession("POST", { role, accessKey });

export const clearMerchantSession = () => requestMerchantSession("DELETE");
