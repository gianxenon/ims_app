import { NextResponse } from "next/server"
import { z } from "zod"
import { callPhp } from "@/src/infrastructure/php-client"

export async function GET() {
  const result = await callPhp({
    payload: { type: "CheckConnection" },
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: "PHP connection check failed",
        error: result.error,
      },
      { status: 503 }
    )
  }

  const checkSchema = z.looseObject({
    connection: z.array(z.unknown()).optional(),
  })
  const parsed = checkSchema.safeParse(result.parsed)

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "PHP health payload invalid",
      },
      { status: 503 }
    )
  }

  return NextResponse.json({
    ok: true,
    source: "php",
  })
}
