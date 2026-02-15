import { NextResponse } from "next/server"
import { z } from "zod"
import { callPhp } from "@/src/lib/php-client"

const lineSchema = z.object({
  u_batch: z.string().optional(),
  u_location: z.string().optional(),
  u_tagno: z.string().optional(),
})

const bodySchema = z.object({
  company: z.string().min(1),
  branch: z.string().min(1),
  docid: z.union([z.number(), z.string(), z.null()]).optional(),
  lines: z.array(lineSchema),
})

const phpErrorSchema = z.looseObject({
  lineNo: z.union([z.number(), z.string()]).optional(),
  field: z.string().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
})

const phpResponseSchema = z.looseObject({
  ok: z.boolean().optional(),
  errors: z.array(phpErrorSchema).optional(),
})

export async function POST(req: Request) {
  try {
    const rawBody = await req.json()
    const parsedBody = bodySchema.safeParse(rawBody)
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid validation payload", issues: parsedBody.error.issues },
        { status: 400 }
      )
    }

    const phpResult = await callPhp({
      payload: {
        type: "receivingvalidate",
        company: parsedBody.data.company,
        branch: parsedBody.data.branch,
        docid: parsedBody.data.docid ?? null,
        lines: parsedBody.data.lines,
      },
    })

    if (!phpResult.ok) {
      return NextResponse.json(
        { message: "Receiving validation API failed", error: phpResult.error, raw: phpResult.raw },
        { status: phpResult.status }
      )
    }

    const parsedPhp = phpResponseSchema.safeParse(phpResult.parsed)
    if (!parsedPhp.success) {
      return NextResponse.json({ ok: false, errors: [] }, { status: 200 })
    }

    return NextResponse.json({
      ok: parsedPhp.data.ok ?? false,
      errors: parsedPhp.data.errors ?? [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Validation route crashed", error: message }, { status: 500 })
  }
}

