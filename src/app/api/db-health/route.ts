import { NextResponse } from "next/server"
import { getPool } from "@/src/infrastructure/db"

export async function GET() {
  try {
    const pool = await getPool()
    const result = await pool.request().query("SELECT 1 AS ok")
    const ok = Boolean(result.recordset?.[0]?.ok ?? 0)
    return NextResponse.json({ ok, source: "db" })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, source: "db", message }, { status: 503 })
  }
}
