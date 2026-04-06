import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

import { callPhp, extractPhpRows } from "@/src/infrastructure/php-client"
import { extractSessionUserId, isSessionJwtValid } from "@/src/shared/auth/session"

type ReceivingMutationType = "receivingdraftadd" | "receivingdraftupdate"

const receivingMutationTypeSchema = z.enum(["receivingdraftadd", "receivingdraftupdate"])

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

const webHeaderSchema = z.looseObject({
  docstatus: z.string().optional(),
  documentNo: z.string().optional(),
  customerNo: z.string().optional(),
  customerName: z.string().optional(),
  customerGroup: z.string().optional(),
  receivingType: z.string().optional(),
  seriesName: z.string().optional(),
  palletId: z.string().optional(),
  location: z.string().optional(),
  remarks: z.string().optional(),
  totalQty: z.union([z.string(), z.number()]).optional(),
  totalHeads: z.union([z.string(), z.number()]).optional(),
  totalWeight: z.union([z.string(), z.number()]).optional(),
})

const webLineSchema = z.looseObject({
  lineNo: z.union([z.string(), z.number()]).optional(),
  tagNo: z.string().optional(),
  itemNo: z.string().optional(),
  itemName: z.string().optional(),
  receivingCategory: z.string().optional(),
  prdDate: z.union([z.string(), z.null()]).optional(),
  expDate: z.union([z.string(), z.null()]).optional(),
  quantity: z.union([z.string(), z.number()]).optional(),
  heads: z.union([z.string(), z.number()]).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
  palletId: z.string().optional(),
  location: z.string().optional(),
})

const webPayloadSchema = z.object({
  type: receivingMutationTypeSchema.optional(),
  company: z.string().optional(),
  branch: z.string().optional(),
  header: webHeaderSchema,
  lines: z.array(webLineSchema).min(1),
})

function pickParam(url: URL, key: string): string {
  return url.searchParams.get(key)?.trim() ?? ""
}

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value)
}

function clean(value: unknown): string {
  return str(value).trim()
}

function num(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function pickMutationType(value: unknown): ReceivingMutationType {
  const parsed = receivingMutationTypeSchema.safeParse(value)
  return parsed.success ? parsed.data : "receivingdraftadd"
}

function pickCompanyBranch(payload: { company?: string; branch?: string }) {
  const company = clean(payload.company) || clean(process.env.PHP_COMPANY)
  const branch = clean(payload.branch) || clean(process.env.PHP_BRANCH)
  return { company, branch }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const company = pickParam(url, "company") || ""
    const branch = pickParam(url, "branch") || ""
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

export async function POST(req: Request) {
  try {
    const rawBody = await req.json()
    const parsedBody = webPayloadSchema.safeParse(rawBody)
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid web receiving payload", issues: parsedBody.error.issues },
        { status: 400 }
      )
    }

    const body = parsedBody.data
    const { company, branch } = pickCompanyBranch(body)
    if (!company || !branch) {
      return NextResponse.json(
        { message: "Missing company/branch. Provide in body or configure PHP_COMPANY/PHP_BRANCH." },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value
    const sessionUserId = isSessionJwtValid(token) ? extractSessionUserId(token) : ""
    const mutationType = pickMutationType(body.type)
    const headerWithUser = sessionUserId
      ? {
          ...body.header,
          ...(mutationType === "receivingdraftadd" ? { createdby: sessionUserId } : {}),
        }
      : body.header

    const phpPayload = {
      type: mutationType,
      company,
      branch,
      header: headerWithUser,
      lines: body.lines,
    }

    console.log("[receiving] payload", JSON.stringify(phpPayload))

    const phpResult = await callPhp({ payload: phpPayload })

    if (!phpResult.ok) {
      return NextResponse.json(
        { message: "Receiving API failed", error: phpResult.error, raw: phpResult.raw },
        { status: phpResult.status }
      )
    }

    return NextResponse.json({
      ok: true,
      result: phpResult.parsed,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Receiving route crashed", error: message }, { status: 500 })
  }
}
