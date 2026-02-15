import { NextResponse } from "next/server"
import { z } from "zod"
import { callPhp, extractPhpRows } from "@/src/lib/php-client"

const itemApiRowSchema = z.looseObject({
  CODE: z.string().optional(),
  code: z.string().optional(),
  NAME: z.string().optional(),
  name: z.string().optional(),
})

function pickParam(url: URL, key: string): string {
  return url.searchParams.get(key)?.trim() ?? ""
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const company = pickParam(url, "company") || process.env.PHP_COMPANY || ""
    const branch = pickParam(url, "branch") || process.env.PHP_BRANCH || ""

    if (!company || !branch) {
      return NextResponse.json(
        { message: "Missing company/branch. Pass /api/items?company=...&branch=..." },
        { status: 400 }
      )
    }

    const phpResult = await callPhp({
      payload: {
        type: "fetchitems",
        company,
        branch,
      },
    })

    if (!phpResult.ok) {
      return NextResponse.json(
        { message: "Items API request failed", error: phpResult.error, raw: phpResult.raw },
        { status: phpResult.status }
      )
    }

    const rawRows = extractPhpRows(phpResult.parsed)
    const parsedRows = z.array(itemApiRowSchema).safeParse(rawRows)

    if (!parsedRows.success) {
      return NextResponse.json(
        {
          message: "Items API payload shape invalid",
          issues: parsedRows.error.issues,
        },
        { status: 502 }
      )
    }

    const items = parsedRows.data.map((row) => ({
      itemNo: String(row.CODE ?? row.code ?? ""),
      itemName: String(row.NAME ?? row.name ?? ""),
    }))

    return NextResponse.json({ items })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Failed to load items", error: message }, { status: 500 })
  }
}

