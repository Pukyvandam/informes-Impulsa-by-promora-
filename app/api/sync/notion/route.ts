import { NextRequest, NextResponse } from "next/server";
import { syncImpulsados } from "@/lib/notion/sync";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.SYNC_SECRET ?? "changeme";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncImpulsados();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Notion sync error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// Allow Vercel Cron (GET with cron secret header)
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.SYNC_SECRET ?? "changeme";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await syncImpulsados();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
