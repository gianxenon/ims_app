import { NextResponse } from "next/server"
import { z } from "zod"

import { callPhp } from "@/src/infrastructure/php-client"

const receivingMobileLineSchema = z.looseObject({
  seriesname: z.string().optional(),
  seriesName: z.string().optional(),
  custno: z.string().optional(),
  custNo: z.string().optional(),
  roomtype: z.string().optional(),
  roomType: z.string().optional(),
  receivecategory: z.string().optional(),
  receiveCategory: z.string().optional(),
  custname: z.string().optional(),
  custName: z.string().optional(),
  palletAddress: z.string().optional(),
  palletaddress: z.string().optional(),
  batch: z.string().optional(),
  selectedDate: z.string().optional(),
  selecteddate: z.string().optional(),
  qrcode: z.string().optional(),
  qrCode: z.string().optional(),
})

const mobilePayloadSchema = z.object({
  company: z.string().optional(),
  branch: z.string().optional(),
  receiving: z.array(receivingMobileLineSchema).min(1),
})

type MobilePayload = z.infer<typeof mobilePayloadSchema>
type MobileLine = z.infer<typeof receivingMobileLineSchema>

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value)
}

function clean(value: unknown): string {
  return str(value).trim()
}

function numeric(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseQrCode(qrcode: string) {
  const parts = qrcode.split("|")
  return {
    tagNo: clean(parts[0]),
    itemNo: clean(parts[1]),
    quantity: numeric(parts[2], 1),
    heads: numeric(parts[3], 0),
    weight: numeric(parts[4], 0),
    expDate: clean(parts[8]),
    prdDate: clean(parts[9]),
  }
}

function pickCompanyBranch(payload: { company?: string; branch?: string }) {
  const company = clean(payload.company) || clean(process.env.PHP_COMPANY)
  const branch = clean(payload.branch) || clean(process.env.PHP_BRANCH)
  return { company, branch }
}

function toNormalizedMobileLine(line: MobileLine) {
  return {
    seriesname: clean(line.seriesname ?? line.seriesName),
    custno: clean(line.custno ?? line.custNo),
    roomtype: clean(line.roomtype ?? line.roomType),
    receivecategory: clean(line.receivecategory ?? line.receiveCategory),
    custname: clean(line.custname ?? line.custName),
    palletAddress: clean(line.palletAddress ?? line.palletaddress),
    batch: clean(line.batch),
    selectedDate: clean(line.selectedDate ?? line.selecteddate),
    qrcode: clean(line.qrcode ?? line.qrCode),
  }
}

function buildDraftPayloadFromMobile(payload: MobilePayload) {
  const normalizedLines = payload.receiving.map(toNormalizedMobileLine)

  const missingFields: Array<{ lineNo: number; fields: string[] }> = []
  normalizedLines.forEach((line, index) => {
    const fields: string[] = []
    if (!line.seriesname) fields.push("seriesname")
    if (!line.custno) fields.push("custno")
    if (!line.custname) fields.push("custname")
    if (!line.receivecategory) fields.push("receivecategory")
    if (!line.palletAddress) fields.push("palletAddress")
    if (!line.batch) fields.push("batch")
    if (!line.selectedDate) fields.push("selectedDate")
    if (!line.qrcode) fields.push("qrcode")
    if (fields.length > 0) {
      missingFields.push({ lineNo: index + 1, fields })
    }
  })

  if (missingFields.length > 0) {
    return {
      ok: false as const,
      missingFields,
    }
  }

  const first = normalizedLines[0]
  if (!first) {
    return {
      ok: false as const,
      missingFields: [{ lineNo: 1, fields: ["receiving"] }],
    }
  }

  const draftLines = normalizedLines.map((line, index) => {
    const parsedQr = parseQrCode(line.qrcode)
    return {
      lineNo: index + 1,
      tagNo: parsedQr.tagNo,
      itemNo: parsedQr.itemNo,
      itemName: "",
      receivingCategory: line.receivecategory,
      prdDate: line.selectedDate || parsedQr.prdDate || null,
      expDate: parsedQr.expDate || null,
      quantity: parsedQr.quantity,
      heads: parsedQr.heads,
      weight: parsedQr.weight,
      palletId: line.batch,
      location: line.palletAddress,
    }
  })

  const isReturnSeries = first.seriesname.toLowerCase().includes("return")
  const totalQty = draftLines.reduce((sum, line) => sum + numeric(line.quantity), 0)
  const totalHeads = draftLines.reduce((sum, line) => sum + numeric(line.heads), 0)
  const totalWeight = draftLines.reduce((sum, line) => sum + numeric(line.weight), 0)

  return {
    ok: true as const,
    normalizedLines,
    header: {
      docstatus: "D",
      documentNo: "",
      customerNo: first.custno,
      customerName: first.custname,
      customerGroup: "",
      receivingType: isReturnSeries ? "CS_RETURN" : "CS_RECEIVING",
      seriesName: first.seriesname,
      palletId: first.batch,
      location: first.palletAddress,
      remarks: "",
      totalQty,
      totalHeads,
      totalWeight,
    },
    lines: draftLines,
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json()
    const parsedBody = mobilePayloadSchema.safeParse(rawBody)
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid mobile receiving payload", issues: parsedBody.error.issues },
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

    const builtDraftPayload = buildDraftPayloadFromMobile(body)
    if (!builtDraftPayload.ok) {
      return NextResponse.json(
        {
          message: "Invalid mobile receiving payload",
          missingFields: builtDraftPayload.missingFields,
        },
        { status: 400 }
      )
    }

    const phpPayload = {
      type: "receivingdraftadd",
      company,
      branch,
      receiving: builtDraftPayload.normalizedLines,
      header: builtDraftPayload.header,
      lines: builtDraftPayload.lines,
    }

    const phpResult = await callPhp({ payload: phpPayload })

    if (!phpResult.ok) {
      return NextResponse.json(
        { message: "Mobile receiving API failed", error: phpResult.error, raw: phpResult.raw },
        { status: phpResult.status }
      )
    }

    return NextResponse.json({
      ok: true,
      result: phpResult.parsed,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Mobile receiving route crashed", error: message }, { status: 500 })
  }
}
