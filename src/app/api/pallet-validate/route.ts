import { NextResponse } from "next/server"
import { z } from "zod"
import { callPhp } from "@/src/infrastructure/php-client"

const bodySchema = z.object({
  company: z.string().min(1),
  branch: z.string().min(1),
  u_batch: z.string().min(1),
  docid: z.union([z.number(), z.string(), z.null()]).optional(),
})

const phpErrorSchema = z.looseObject({
  field: z.string().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
  field_name: z.string().optional(),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
})

const phpResponseSchema = z.looseObject({
  ok: z.boolean().optional(),
  valid: z.boolean().optional(),
  exists: z.boolean().optional(),
  isOccupied: z.boolean().optional(),
  message: z.string().optional(),
  errors: z.array(phpErrorSchema).optional(),
  rows: z.array(phpErrorSchema).optional(),
})

type NormalizedError = { field?: string; code?: string; message?: string }

const pickFirst = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim().length > 0) {
      return String(value)
    }
  }
  return ""
}

const normalizeRow = (row: Record<string, unknown>): NormalizedError => {
  const field = pickFirst(row, ["field", "field_name", "FIELD_NAME", "fieldName"])
  const code = pickFirst(row, ["code", "error_code", "ERROR_CODE", "errorCode"])
  const message = pickFirst(row, ["message", "error_message", "ERROR_MESSAGE", "errorMessage"])
  return {
    field: field || undefined,
    code: code || undefined,
    message: message || undefined,
  }
}

const normalizeErrors = (raw: unknown): NormalizedError[] => {
  const parsed = phpResponseSchema.safeParse(raw)
  if (!parsed.success) {
    if (Array.isArray(raw)) {
      return raw
        .filter((row) => row && typeof row === "object")
        .map((row) => normalizeRow(row as Record<string, unknown>))
        .filter((row) => Boolean(row.field || row.code || row.message))
    }
    if (raw && typeof raw === "object") {
      const rows = (raw as { rows?: unknown[] }).rows
      if (Array.isArray(rows)) {
        return rows
          .filter((row) => row && typeof row === "object")
          .map((row) => normalizeRow(row as Record<string, unknown>))
          .filter((row) => Boolean(row.field || row.code || row.message))
      }
    }
    return []
  }

  const { errors, rows } = parsed.data
  const rawErrors = Array.isArray(errors) ? errors : Array.isArray(rows) ? rows : []
  return rawErrors
    .filter((row) => row && typeof row === "object")
    .map((row) => normalizeRow(row as Record<string, unknown>))
    .filter((row) => Boolean(row.field || row.code || row.message))
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json()
    const parsedBody = bodySchema.safeParse(rawBody)
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid pallet validation payload", issues: parsedBody.error.issues },
        { status: 400 }
      )
    }

    const phpResult = await callPhp({
      payload: {
        type: "validatepalletaddress",
        company: parsedBody.data.company,
        branch: parsedBody.data.branch,
        u_batch: parsedBody.data.u_batch,
        docid: parsedBody.data.docid ?? null,
      },
    })

    if (!phpResult.ok) {
      return NextResponse.json(
        { message: "Pallet validation API failed", error: phpResult.error, raw: phpResult.raw },
        { status: phpResult.status }
      )
    }

    const normalizedErrors = normalizeErrors(phpResult.parsed)
    const parsedPhp = phpResponseSchema.safeParse(phpResult.parsed)
    const valid =
      parsedPhp.success && typeof parsedPhp.data.valid === "boolean"
        ? parsedPhp.data.valid
        : normalizedErrors.length === 0
    const message =
      normalizedErrors[0]?.message ??
      (parsedPhp.success ? parsedPhp.data.message ?? "" : "") ??
      ""

    return NextResponse.json({
      ok: valid,
      valid,
      message,
      errors: normalizedErrors,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { message: "Location validation route crashed", error: message },
      { status: 500 }
    )
  }
}

