import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize a Supabase client with the Service Role Key for administrative actions.
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const password = process.env.DEFAULT_USER_PASSWORD;

export async function POST(request: Request) {
  // Require caller to present a valid Supabase access token (Bearer)
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing authorization token." },
      { status: 401 },
    );
  }

  const callerToken = authHeader.split(" ")[1];

  // Validate caller and ensure they are an admin in the `users` table
  try {
    const { data: callerData, error: callerErr } =
      await adminSupabase!.auth.getUser(callerToken as string);
    if (callerErr || !callerData?.user?.id) {
      return NextResponse.json(
        { error: "Invalid auth token." },
        { status: 401 },
      );
    }

    const callerId = callerData.user.id;
    const { data: callerProfile, error: profileErr } = await adminSupabase!
      .from("users")
      .select("role")
      .eq("id", callerId)
      .maybeSingle();

    if (profileErr || !callerProfile || callerProfile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to validate caller." },
      { status: 401 },
    );
  }

  const body = await request.json();
  const { email, displayName, role } = body ?? {};

  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string" ||
    !displayName ||
    typeof displayName !== "string" ||
    !role ||
    typeof role !== "string"
  ) {
    return NextResponse.json(
      { error: "Email, password, display name, and role are required." },
      { status: 400 },
    );
  }

  try {
    const { data, error: createUserError } =
      await adminSupabase!.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createUserError) {
      return NextResponse.json(
        { error: createUserError.message || "Unable to create auth user." },
        { status: 400 },
      );
    }

    const userId = data?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Failed to create user identity." },
        { status: 500 },
      );
    }

    const now = new Date().toISOString();
    const { error: profileError } = await adminSupabase!.from("users").insert([
      {
        id: userId,
        email,
        display_name: displayName,
        role,
        is_active: true,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      },
    ]);

    if (profileError) {
      await adminSupabase!.auth.admin.deleteUser(userId).catch(() => undefined);
      return NextResponse.json(
        { error: profileError.message || "Unable to create user profile." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
