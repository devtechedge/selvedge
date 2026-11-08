import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: "reachable",
      commit: env.commitSha,
      timestamp,
    });
  } catch {
    return NextResponse.json(
      { ok: false, database: "unreachable", commit: env.commitSha, timestamp },
      { status: 503 }
    );
  }
}