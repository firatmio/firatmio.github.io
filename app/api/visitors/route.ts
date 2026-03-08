import { createClient } from "redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";

function getRedisClient() {
  return createClient({ url: process.env.REDIS_URL });
}

export async function POST() {
  const client = getRedisClient();
  try {
    await client.connect();

    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    // Hash the IP so we don't store raw IPs
    const hash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

    // Add to unique visitors set — returns count of new members added
    const added = await client.sAdd("visitors:unique", hash);

    if (added > 0) {
      await client.incr("visitors:total");
    }

    const total = Number(await client.get("visitors:total")) || 0;
    await client.disconnect();
    return NextResponse.json({ count: total });
  } catch {
    await client.disconnect().catch(() => {});
    return NextResponse.json({ count: 0 });
  }
}

export async function GET() {
  const client = getRedisClient();
  try {
    await client.connect();
    const total = Number(await client.get("visitors:total")) || 0;
    await client.disconnect();
    return NextResponse.json({ count: total });
  } catch {
    await client.disconnect().catch(() => {});
    return NextResponse.json({ count: 0 });
  }
}
