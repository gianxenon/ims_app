import { NextResponse } from "next/server"
import { RECEIVING_CATEGORY_VALUES } from "@/src/shared/transaction-enums"

function pickParam(url: URL, key: string): string {
  return url.searchParams.get(key)?.trim() ?? ""
}

export function GET(req: Request) {
  const url = new URL(req.url)
  const company = pickParam(url, "company") || process.env.PHP_COMPANY || ""
  const branch = pickParam(url, "branch") || process.env.PHP_BRANCH || ""

  if (!company || !branch) {
    return NextResponse.json(
      { message: "Missing company/branch. Pass /api/receiving/categories?company=...&branch=..." },
      { status: 400 }
    )
  }

  return NextResponse.json({ categories: RECEIVING_CATEGORY_VALUES })
}
