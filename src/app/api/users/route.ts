import { NextResponse } from "next/server"
import { getPool } from "@/src/lib/db" 

export async function GET() {
  const pool = await getPool()

  const result = await pool
    .request()
    .query("SELECT TOP 20 UsersId, Username, Email FROM Users ORDER BY UsersId DESC")

  return NextResponse.json({ rows: result.recordset })
}
