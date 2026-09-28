import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SESSION_COOKIE = "merchant_dashboard_session";
const SESSION_MAX_AGE = 15 * 60;
const roles = ["admin", "warehouse", "customer_service", "guest"] as const;
type MerchantRole = (typeof roles)[number];

const getSupabaseClient = (accessToken: string) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
};

const getAuthenticatedUser = async (request: NextRequest) => {
  const accessToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!accessToken) return null;

  const supabase = getSupabaseClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return { supabase, user: data.user };
};

const sessionCookie = (role: MerchantRole) => ({
  name: SESSION_COOKIE,
  value: role,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  // The session is checked through /api/merchant/session, so it must be
  // available to both the API endpoint and the merchant dashboard routes.
  path: "/",
  maxAge: SESSION_MAX_AGE,
});

const noMerchantSession = (normalDashboardSession: boolean) =>
  NextResponse.json({ normalDashboardSession, role: null });

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) return noMerchantSession(false);

  const role = request.cookies.get(SESSION_COOKIE)?.value as
    | MerchantRole
    | undefined;
  if (!role || !roles.includes(role)) return noMerchantSession(true);

  if (role === "guest") {
    const response = NextResponse.json({ normalDashboardSession: true, role });
    response.cookies.set(sessionCookie(role));
    return response;
  }

  const { data, error } = await auth.supabase
    .from("merchant_access_keys")
    .select("role")
    .eq("id", auth.user.id)
    .eq("role", role)
    .maybeSingle();

  if (error || !data) {
    const response = noMerchantSession(true);
    response.cookies.set({
      name: SESSION_COOKIE,
      value: "",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  const response = NextResponse.json({ normalDashboardSession: true, role });
  response.cookies.set(sessionCookie(role));
  return response;
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return NextResponse.json(
      {
        error: "Sign in to the main dashboard before accessing merchant tools.",
      },
      { status: 401 },
    );
  }

  const body = (await request.json()) as { role?: string; accessKey?: string };
  if (!body.role || !roles.includes(body.role as MerchantRole)) {
    return NextResponse.json(
      { error: "A valid role is required." },
      { status: 400 },
    );
  }

  const role = body.role as MerchantRole;
  if (role === "guest") {
    const response = NextResponse.json({ normalDashboardSession: true, role });
    response.cookies.set(sessionCookie(role));
    return response;
  }

  if (!body.accessKey) {
    return NextResponse.json(
      { error: "An access key is required for this role." },
      { status: 400 },
    );
  }

  const { data, error } = await auth
    .supabase!.from("merchant_access_keys")
    .select("role")
    .eq("id", auth.user.id)
    .eq("role", role)
    .eq("access_key", body.accessKey)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: "Invalid access key for this user and role." },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ normalDashboardSession: true, role });
  response.cookies.set(sessionCookie(role));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({
    normalDashboardSession: false,
    role: null,
  });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
