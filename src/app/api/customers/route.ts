import { NextResponse } from "next/server"
import { z } from "zod"
import { callPhp, extractPhpRows } from "@/src/lib/php-client"

const customerApiRowSchema = z.looseObject({
  CUSTNO: z.string().optional(),
  custno: z.string().optional(),
  CUSTNAME: z.string().optional(),
  custname: z.string().optional(),
  CUSTGROUP: z.union([z.string(), z.number()]).optional(),
  custgroup: z.union([z.string(), z.number()]).optional(),
  GROUPNAME: z.string().optional(),
  groupname: z.string().optional(),
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
        { message: "Missing company/branch. Pass /api/customers?company=...&branch=..." },
        { status: 400 }
      )
    }

    const phpResult = await callPhp({
      payload: {
        type: "fetchcustomers",
        company,
        branch,
      },
    })

    if (!phpResult.ok) {
      return NextResponse.json(
        { message: "Customers API request failed", error: phpResult.error, raw: phpResult.raw },
        { status: phpResult.status }
      )
    }

    const rawRows = extractPhpRows(phpResult.parsed)
    const parsedRows = z.array(customerApiRowSchema).safeParse(rawRows)

    if (!parsedRows.success) {
      return NextResponse.json(
        {
          message: "Customers API payload shape invalid",
          issues: parsedRows.error.issues,
        },
        { status: 502 }
      )
    }

    const customers = parsedRows.data.map((row) => ({
      customerNo: String(row.CUSTNO ?? row.custno ?? ""),
      customerName: String(row.CUSTNAME ?? row.custname ?? ""),
      customerGroup: String(row.CUSTGROUP ?? row.custgroup ?? ""),
      groupName: String(row.GROUPNAME ?? row.groupname ?? ""),
    }))

    return NextResponse.json({ customers })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Failed to load customers", error: message }, { status: 500 })
  }
}

