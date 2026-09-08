import { NextResponse } from "next/server";

const supabaseUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const body = await request.json();
    const endpoint = body?.endpoint;
    const keys = body?.keys;
    if (!endpoint || !keys?.p256dh || !keys?.auth) return NextResponse.json({ ok: false, error: "INVALID_SUBSCRIPTION" }, { status: 400 });
    if (!supabaseUrl() || !serviceKey()) return NextResponse.json({ ok: false, error: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });

    const response = await fetch(`${supabaseUrl()}/rest/v1/push_subscriptions`, {
      method: "POST",
      headers: {
        apikey: serviceKey(),
        Authorization: `Bearer ${serviceKey()}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth, active: true, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || "SUBSCRIBE_FAILED" }, { status: 500 });
  }
}
