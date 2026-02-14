import { NextResponse } from "next/server"

type InventoryApiRow = {
  U_RECDATE?: string
  U_CUSTNO?: string
  U_CUSTNAME?: string
  U_RECEIVEDTYPE?: string
  U_ITEMNO?: string
  U_ITEMNAME?: string
  U_BATCH?: string
  U_TAGNO?: string
  u_tagno?: string
  U_LOCATION?: string
  U_QUANTITY?: number | string
  TOTALQUANTITY?: number | string
  U_WEIGHT?: number | string
  TOTALWEIGHT?: number | string
  U_NUMPERHEADS?: number | string
  U_TOTALNUMPERHEADS?: number | string
  U_UOM?: string
  PD?: string
  CU?: string
  expiry_status?: string
  EXPIRY_STATUS?: string
}

function toNumber(value: unknown): number {
  return Number(value ?? 0)
}

function normalizeStatus(value: unknown): "GOOD" | "NEAR EXPIRY" | "EXPIRED" {
  const v = String(value ?? "GOOD").toUpperCase().trim()
  if (v === "EXPIRED") return "EXPIRED"
  if (v === "NEAR EXPIRY") return "NEAR EXPIRY"
  return "GOOD"
}

function pickParam(url: URL, key: string): string {
  return url.searchParams.get(key)?.trim() ?? ""
}

export async function GET(req: Request) {
  try {
    const base = process.env.PHP_API_BASE
    if (!base) {
      return NextResponse.json({ message: "Missing PHP_API_BASE" }, { status: 500 })
    }

    const url = new URL(req.url)

    const company = pickParam(url, "company") || process.env.PHP_COMPANY || ""
    const branch = pickParam(url, "branch") || process.env.PHP_BRANCH || ""

    const showdetails = Number(url.searchParams.get("showdetails") ?? "0")
    const withpendings = Number(url.searchParams.get("withpendings") ?? "1")

    const batch = pickParam(url, "batch")
    const tagno = pickParam(url, "tagno")
    const location = pickParam(url, "location")
    const receivedtype = pickParam(url, "receivedtype")
    const custno = pickParam(url, "custno")
    const itemno = pickParam(url, "itemno")
    const prd_from = pickParam(url, "prd_from")
    const prd_to = pickParam(url, "prd_to")
    const exp_from = pickParam(url, "exp_from")
    const exp_to = pickParam(url, "exp_to")
    const rec_from = pickParam(url, "rec_from")
    const rec_to = pickParam(url, "rec_to")

    if (!company || !branch) {
      return NextResponse.json(
        { message: "Missing company/branch. Pass /api/inventory-table?company=...&branch=..." },
        { status: 400 }
      )
    }

    const phpUrl = `${base}/udp.php?objectcode=u_ajaxtest`

    const phpRes = await fetch(phpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        type: "fetchinventorytable",
        company,
        branch,
        showdetails,
        withpendings,
        batch,
        tagno,
        location,
        receivedtype,
        custno,
        itemno,
        prd_from,
        prd_to,
        exp_from,
        exp_to,
        rec_from,
        rec_to,
      }),
      cache: "no-store",
    })

    const raw = await phpRes.text()
    let parsed: unknown = null

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      return NextResponse.json({ message: "PHP returned non-JSON", raw }, { status: 502 })
    }

    const rows = Array.isArray(parsed)
      ? (parsed as InventoryApiRow[])
      : Array.isArray((parsed as { rows?: unknown[] })?.rows)
        ? ((parsed as { rows: InventoryApiRow[] }).rows ?? [])
        : []

    const data = rows.map((row, index) => ({
      id: index + 1,
      recDate: String(row.U_RECDATE ?? ""),
      custNo: String(row.U_CUSTNO ?? ""),
      custName: String(row.U_CUSTNAME ?? ""),
      receivedType: String(row.U_RECEIVEDTYPE ?? ""),
      itemNo: String(row.U_ITEMNO ?? ""),
      itemName: String(row.U_ITEMNAME ?? ""),
      batch: String(row.U_BATCH ?? ""),
      barcode: String(row.U_TAGNO ?? row.u_tagno ?? ""),
      location: String(row.U_LOCATION ?? ""),
      headsPacks: toNumber(row.U_TOTALNUMPERHEADS ?? row.U_NUMPERHEADS),
      quantity: toNumber(row.TOTALQUANTITY ?? row.U_QUANTITY),
      weight: toNumber(row.TOTALWEIGHT ?? row.U_WEIGHT),
      uom: String(row.U_UOM ?? ""),
      pd: String(row.PD ?? ""),
      ed: String(row.CU ?? ""),
      expiryStatus: normalizeStatus(row.expiry_status ?? row.EXPIRY_STATUS),
    }))

    if (!phpRes.ok) {
      return NextResponse.json(
        { message: "Inventory API request failed", raw, data },
        { status: phpRes.status }
      )
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Failed to load inventory table", error: message }, { status: 500 })
  }
}
