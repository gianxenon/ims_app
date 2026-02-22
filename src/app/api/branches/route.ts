import { NextResponse } from "next/server"
import { z } from "zod"
import { callPhp, extractPhpRows } from "@/src/infrastructure/php-client"

const branchApiRowSchema = z.looseObject({
    COMPANYCODE: z.string().optional(),
    companycode: z.string().optional(),
    BRANCHCODE: z.string().optional(),
    branchcode: z.string().optional(),
    BRANCHNAME: z.string().optional(),
    branchname: z.string().optional(),
  })

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const userid = url.searchParams.get("userid")?.trim() ?? ""

    const phpResult = await callPhp({
      payload: { type: "getbranches", userid },
    })

    if (!phpResult.ok) {
      return NextResponse.json(
        { message: "Branches API request failed", error: phpResult.error, raw: phpResult.raw },
        { status: phpResult.status }
      )
    }

    const rawRows = extractPhpRows(phpResult.parsed)
    const parsedRows = z.array(branchApiRowSchema).safeParse(rawRows)

    if (!parsedRows.success) {
      return NextResponse.json(
        {
          message: "Branches API payload shape invalid",
          issues: parsedRows.error.issues,
        },
        { status: 502 }
      )
    }

    const branches = parsedRows.data.map((row) => ({
      companyCode: String(row.COMPANYCODE ?? row.companycode ?? ""),
      branchCode: String(row.BRANCHCODE ?? row.branchcode ?? ""),
      branchName: String(row.BRANCHNAME ?? row.branchname ?? ""),
    }))

    return NextResponse.json({ branches })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Failed to load branches", error: message }, { status: 500 })
  }
}
