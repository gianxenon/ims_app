import { NextResponse } from "next/server"
import { z } from "zod"
import { callPhp } from "@/src/infrastructure/php-client"

const CACHE_TTL_MS = 60_000
let lastCheckAt = 0
let lastPayload: { ok: boolean; source?: string; message?: string; error?: string } | null = null
let lastStatus = 200

export async function GET() {
  const now = Date.now()
  if (lastPayload && now - lastCheckAt < CACHE_TTL_MS) {
    return NextResponse.json(lastPayload, { status: lastStatus })
  }

  const result = await callPhp({
    payload: { type: "CheckConnection" },
  })

  if (!result.ok) {
    lastPayload = {
      ok: false,
      message: "PHP connection check failed",
      error: result.error,
    }
    lastStatus = 503
    lastCheckAt = now
    return NextResponse.json(lastPayload, { status: lastStatus })
  }

  const checkSchema = z.looseObject({
    connection: z.array(z.unknown()).optional(),
  })
  const parsed = checkSchema.safeParse(result.parsed)

  if (!parsed.success) {
    lastPayload = {
      ok: false,
      message: "PHP health payload invalid",
    }
    lastStatus = 503
    lastCheckAt = now
    return NextResponse.json(lastPayload, { status: lastStatus })
  }

  lastPayload = {
    ok: true,
    source: "php",
  }
  lastStatus = 200
  lastCheckAt = now
  return NextResponse.json(lastPayload, { status: lastStatus })
}
