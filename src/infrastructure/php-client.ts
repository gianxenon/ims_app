import { z } from "zod"

type PhpCallInput = {
  payload: Record<string, unknown>
  objectcode?: string
}

type PhpCallSuccess = {
  ok: true
  status: number
  raw: string
  parsed: unknown
}

type PhpCallFailure = {
  ok: false
  status: number
  error: string
  raw?: string
  parsed?: unknown
}

export type PhpCallResult = PhpCallSuccess | PhpCallFailure

const PhpRowsEnvelopeSchema = z.object({
  rows: z.array(z.unknown()).optional(),
})

export async function callPhp({
  payload,
  objectcode = "u_ajaxtest",
}: PhpCallInput): Promise<PhpCallResult> {
  const base = process.env.PHP_API_BASE
  if (!base) {
    return { ok: false, status: 500, error: "Missing PHP_API_BASE" }
  }

  const phpUrl = `${base}/udp.php?objectcode=${encodeURIComponent(objectcode)}`

  try {
    const res = await fetch(phpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const raw = await res.text()
    let parsed: unknown = null

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      return {
        ok: false,
        status: 502,
        error: "PHP returned non-JSON",
        raw,
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: "PHP request failed",
        raw,
        parsed,
      }
    }

    return {
      ok: true,
      status: res.status,
      raw,
      parsed,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      status: 500,
      error: message,
    }
  }
}

export function extractPhpRows(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed

  const envelope = PhpRowsEnvelopeSchema.safeParse(parsed)
  if (envelope.success && Array.isArray(envelope.data.rows)) {
    return envelope.data.rows
  }

  return []
}

