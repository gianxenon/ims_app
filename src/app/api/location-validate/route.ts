import { NextResponse } from "next/server"
import { z } from "zod"
import { callPhp } from "@/src/lib/php-client"

const bodySchema = z.object({
  company: z.string().min(1),
  branch: z.string().min(1),
  location: z.string().min(1),
})

const phpResponseSchema = z.looseObject({
  valid: z.boolean().optional(),
  exists: z.boolean().optional(),
  isOccupied: z.boolean().optional(),
  message: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const rawBody = await req.json()
    const parsedBody = bodySchema.safeParse(rawBody)
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid location validation payload", issues: parsedBody.error.issues },
        { status: 400 }
      )
    }

    const phpResult = await callPhp({
      payload: {
        type: "validatelocation",
        company: parsedBody.data.company,
        branch: parsedBody.data.branch,
        location: parsedBody.data.location,
      },
    })

    if (!phpResult.ok) {
      return NextResponse.json(
        { message: "Location validation API failed", error: phpResult.error, raw: phpResult.raw },
        { status: phpResult.status }
      )
    }

    const parsedPhp = phpResponseSchema.safeParse(phpResult.parsed)
    if (!parsedPhp.success) {
      return NextResponse.json(
        { valid: false, message: "Invalid location validation response shape" },
        { status: 200 }
      )
    }

    return NextResponse.json({
      valid: parsedPhp.data.valid ?? false,
      exists: parsedPhp.data.exists ?? false,
      isOccupied: parsedPhp.data.isOccupied ?? false,
      message: parsedPhp.data.message ?? "",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { message: "Location validation route crashed", error: message },
      { status: 500 }
    )
  }
}

