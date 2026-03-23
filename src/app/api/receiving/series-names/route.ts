import { NextResponse } from "next/server"

function pickParam(url: URL, key: string): string {
  return url.searchParams.get(key)?.trim() ?? ""
}

const SERIES_NAMES = [
  { code: "CS_RECEIVING", name: "CS Receive" },
  { code: "CS_RETURN", name: "CS Return" },
]

export function GET(req: Request) {
  const url = new URL(req.url)
  const company = pickParam(url, "company") || process.env.PHP_COMPANY || ""
  const branch = pickParam(url, "branch") || process.env.PHP_BRANCH || ""

  if (!company || !branch) {
    return NextResponse.json(
      { message: "Missing company/branch. Pass /api/receiving/series-names?company=...&branch=..." },
      { status: 400 }
    )
  }

  return NextResponse.json({ seriesNames: SERIES_NAMES })
}
