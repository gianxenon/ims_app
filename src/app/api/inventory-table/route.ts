import { NextResponse } from "next/server"
import { z } from "zod"
import { callPhp, extractPhpRows } from "@/src/infrastructure/php-client"

const zText = z.union([z.string(), z.number(), z.null()]).optional()
const zNumeric = z.union([z.string(), z.number(), z.null()]).optional()

const inventoryApiRowSchema = z.looseObject({
    U_RECDATE: zText,
    U_CUSTNO: zText,
    U_CUSTNAME: zText,
    U_RECEIVEDTYPE: zText,
    U_ITEMNO: zText,
    U_ITEMNAME: zText,
    U_BATCH: zText,
    U_TAGNO: zText,
    u_tagno: zText,
    U_LOCATION: zText,
    U_QUANTITY: zNumeric,
    TOTALQUANTITY: zNumeric,
    U_WEIGHT: zNumeric,
    TOTALWEIGHT: zNumeric,
    U_NUMPERHEADS: zNumeric,
    U_TOTALNUMPERHEADS: zNumeric,
    U_UOM: zText,
    PD: zText,
    CU: zText,
    expiry_status: zText,
    EXPIRY_STATUS: zText,
  })

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

    const phpResult = await callPhp({
      payload: {
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
      },
    })

    if (!phpResult.ok) {
      return NextResponse.json(
        { message: "Inventory API request failed", error: phpResult.error, raw: phpResult.raw },
        { status: phpResult.status }
      )
    }

    const rawRows = extractPhpRows(phpResult.parsed)
    const parsedRows = z.array(inventoryApiRowSchema).safeParse(rawRows)

    if (!parsedRows.success) {
      return NextResponse.json(
        {
          message: "Inventory API payload shape invalid",
          issues: parsedRows.error.issues,
        },
        { status: 502 }
      )
    }

    const data = parsedRows.data.map((row, index) => ({
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

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Failed to load inventory table", error: message }, { status: 500 })
  }
}
