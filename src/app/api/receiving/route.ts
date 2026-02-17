import { NextResponse } from "next/server"
import { z } from "zod"

import { callPhp, extractPhpRows } from "@/src/lib/php-client"

const headerRowSchema = z.looseObject({
  DOCID: z.union([z.string(), z.number()]).optional(),
  DOCNO: z.union([z.string(), z.number()]).optional(),
  SYSTEMRECEIVINGDATE: z.union([z.string(), z.number()]).optional(),
  DOCUMENTRECEIVINGDATE: z.union([z.string(), z.number()]).optional(),
  DOCSTATUS: z.union([z.string(), z.number()]).optional(),
  U_CONFIRMED: z.union([z.string(), z.number()]).optional(),
  U_CONFIRMEDBY: z.union([z.string(), z.number()]).optional(),
  U_CONFIRMEDDATETIME: z.union([z.string(), z.number()]).optional(),
  CONFIRMED: z.union([z.string(), z.number()]).optional(),
  CONFIRMEDBY: z.union([z.string(), z.number()]).optional(),
  CONFIRMEDDATETIME: z.union([z.string(), z.number()]).optional(),
  RECEIVINGTYPE: z.union([z.string(), z.number()]).optional(),
  CUSTNO: z.union([z.string(), z.number()]).optional(),
  CUSTNAME: z.union([z.string(), z.number()]).optional(),
  CUSTGROUP: z.union([z.string(), z.number()]).optional(),
  BATCH: z.union([z.string(), z.number()]).optional(),
  LOCATION: z.union([z.string(), z.number()]).optional(),
  REMARKS: z.union([z.string(), z.number()]).optional(),
  TOTALQTY: z.union([z.string(), z.number()]).optional(),
  TOTALHEADS: z.union([z.string(), z.number()]).optional(),
  TOTALWEIGHT: z.union([z.string(), z.number()]).optional(),
})

const lineRowSchema = z.looseObject({
  DOCID: z.union([z.string(), z.number()]).optional(),
  DOCNO: z.union([z.string(), z.number()]).optional(),
  SYSTEMRECEIVINGDATE: z.union([z.string(), z.number()]).optional(),
  DOCUMENTRECEIVINGDATE: z.union([z.string(), z.number()]).optional(),
  DOCSTATUS: z.union([z.string(), z.number()]).optional(),
  U_CONFIRMED: z.union([z.string(), z.number()]).optional(),
  U_CONFIRMEDBY: z.union([z.string(), z.number()]).optional(),
  U_CONFIRMEDDATETIME: z.union([z.string(), z.number()]).optional(),
  CONFIRMED: z.union([z.string(), z.number()]).optional(),
  CONFIRMEDBY: z.union([z.string(), z.number()]).optional(),
  CONFIRMEDDATETIME: z.union([z.string(), z.number()]).optional(),
  LINENO: z.union([z.string(), z.number()]).optional(),
  TAGNO: z.union([z.string(), z.number()]).optional(),
  ITEMNO: z.union([z.string(), z.number()]).optional(),
  ITEMNAME: z.union([z.string(), z.number()]).optional(),
  RECEIVINGCATEGORY: z.union([z.string(), z.number()]).optional(),
  PRDDATE: z.union([z.string(), z.number()]).optional(),
  EXPDATE: z.union([z.string(), z.number()]).optional(),
  QUANTITY: z.union([z.string(), z.number()]).optional(),
  HEADS: z.union([z.string(), z.number()]).optional(),
  WEIGHT: z.union([z.string(), z.number()]).optional(),
  BATCH: z.union([z.string(), z.number()]).optional(),
  LOCATION: z.union([z.string(), z.number()]).optional(),
})

function pickParam(url: URL, key: string): string {
  return url.searchParams.get(key)?.trim() ?? ""
}

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value)
}

function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const company = pickParam(url, "company")  || ""
    const branch = pickParam(url, "branch")   || ""
    const documentNo = pickParam(url, "documentNo") || pickParam(url, "docno")
    const dateFrom = pickParam(url, "dateFrom") || pickParam(url, "date_from")
    const dateTo = pickParam(url, "dateTo") || pickParam(url, "date_to")

    if (!company || !branch) {
      return NextResponse.json(
        { message: "Missing company/branch. Pass /api/receiving?company=...&branch=..." },
        { status: 400 }
      )
    }

    if (documentNo) {
      const phpResult = await callPhp({
        payload: {
          type: "fetchreceivingdocumentlines",
          company,
          branch,
          docno: documentNo,
        },
      })

      if (!phpResult.ok) {
        return NextResponse.json(
          { message: "Receiving document lines API failed", error: phpResult.error, raw: phpResult.raw },
          { status: phpResult.status }
        )
      }

      const rawRows = extractPhpRows(phpResult.parsed)
      const parsedRows = z.array(lineRowSchema).safeParse(rawRows)
      if (!parsedRows.success) {
        return NextResponse.json(
          { message: "Receiving document lines payload invalid", issues: parsedRows.error.issues },
          { status: 502 }
        )
      }

      const firstRow = parsedRows.data[0]
      const lines = parsedRows.data.map((row) => ({
        lineNo: str(row.LINENO),
        tagNo: str(row.TAGNO),
        itemNo: str(row.ITEMNO),
        itemName: str(row.ITEMNAME),
        receivingCategory: str(row.RECEIVINGCATEGORY),
        prdDate: str(row.PRDDATE),
        expDate: str(row.EXPDATE),
        quantity: str(row.QUANTITY),
        heads: str(row.HEADS),
        weight: str(row.WEIGHT),
        palletId: str(row.BATCH),
        location: str(row.LOCATION),
      }))

      return NextResponse.json({
        documentNo,
        status: str(firstRow?.DOCSTATUS),
        isConfirmed: firstRow?.U_CONFIRMED ?? firstRow?.CONFIRMED ?? "",
        confirmedBy: str(firstRow?.U_CONFIRMEDBY ?? firstRow?.CONFIRMEDBY),
        confirmedDateTime: str(firstRow?.U_CONFIRMEDDATETIME ?? firstRow?.CONFIRMEDDATETIME),
        lines,
      })
    }

    const phpResult = await callPhp({
      payload: {
        type: "fetchreceivingdocuments",
        company,
        branch,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        docno: null,
      },
    })

    if (!phpResult.ok) {
      return NextResponse.json(
        { message: "Receiving documents API failed", error: phpResult.error, raw: phpResult.raw },
        { status: phpResult.status }
      )
    }

    const rawRows = extractPhpRows(phpResult.parsed)
    const parsedRows = z.array(headerRowSchema).safeParse(rawRows)
    if (!parsedRows.success) {
      return NextResponse.json(
        { message: "Receiving documents payload invalid", issues: parsedRows.error.issues },
        { status: 502 }
      )
    }

    const documents = parsedRows.data.map((row) => ({
      documentNo: str(row.DOCNO),
      status: str(row.DOCSTATUS),
      isConfirmed: row.U_CONFIRMED ?? row.CONFIRMED ?? "",
      confirmedBy: str(row.U_CONFIRMEDBY ?? row.CONFIRMEDBY),
      confirmedDateTime: str(row.U_CONFIRMEDDATETIME ?? row.CONFIRMEDDATETIME),
      receivingType: str(row.RECEIVINGTYPE),
      customerNo: str(row.CUSTNO),
      customerName: str(row.CUSTNAME),
      customerGroup: str(row.CUSTGROUP),
      palletId: str(row.BATCH),
      location: str(row.LOCATION),
      remarks: str(row.REMARKS),
      systemReceivingDate: str(row.SYSTEMRECEIVINGDATE),
      documentReceivingDate: str(row.DOCUMENTRECEIVINGDATE),
      totalQty: num(row.TOTALQTY),
      totalHeads: num(row.TOTALHEADS),
      totalWeight: num(row.TOTALWEIGHT),
    }))

    return NextResponse.json({ documents })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Failed to load receiving data", error: message }, { status: 500 })
  }
}
