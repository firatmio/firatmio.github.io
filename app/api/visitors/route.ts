import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";

export async function POST() {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    // Hash the IP so we don't store raw IPs
    const hash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

    // Add to unique visitors set — returns 1 if new, 0 if already exists
    const isNew = await kv.sadd("visitors:unique", hash);

    if (isNew) {
      await kv.incr("visitors:total");
    }

    const total = (await kv.get<number>("visitors:total")) || 0;
    return NextResponse.json({ count: total });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

export async function GET() {
  try {
    const total = (await kv.get<number>("visitors:total")) || 0;
    return NextResponse.json({ count: total });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
