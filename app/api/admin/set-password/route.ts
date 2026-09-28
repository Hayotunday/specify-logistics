import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Admin Supabase client using service role key
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing authorization token." },
      { status: 401 },
    );
  }

  const callerToken = authHeader.split(" ")[1];
  // Verify caller is an admin
  let callerId: string | null = null;
  try {
    const { data: callerData, error: callerErr } =
      await adminSupabase.auth.getUser(callerToken as string);
    if (callerErr || !callerData?.user?.id) {
      return NextResponse.json(
        { error: "Invalid auth token." },
        { status: 401 },
      );
    }

    callerId = callerData.user.id;
    const { data: callerProfile, error: profileErr } = await adminSupabase
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
  const { userId, email, password } = body ?? {};

  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  try {
    let targetUserId = userId as string | undefined;

    if (!targetUserId) {
      if (!email || typeof email !== "string") {
        return NextResponse.json(
          { error: "userId or email is required." },
          { status: 400 },
        );
      }
      const { data: found, error: findErr } = await adminSupabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (findErr || !found || !found.id) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      targetUserId = found.id;
    }

    // Update the user's password via the Admin API
    const { data, error: updateErr } =
      await adminSupabase.auth.admin.updateUserById(targetUserId!, {
        password,
      });

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message || "Failed to update password." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, user: data?.user ?? null });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to set password.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
