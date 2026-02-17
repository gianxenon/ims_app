import { NextResponse } from "next/server"
import { z } from "zod"
import { callPhp, extractPhpRows } from "@/src/lib/php-client"

export const runtime = "nodejs"

const requestSchema = z.object({
  company: z.string().trim().min(1).optional(),
  branch: z.string().trim().min(1).optional(),
})

const roomApiRowSchema = z.looseObject({
  RoomCode: z.string().optional(),
  roomCode: z.string().optional(),
  BarcodeTotalQty: z.union([z.string(), z.number(), z.null()]).optional(),
  barcodeTotalQty: z.union([z.string(), z.number(), z.null()]).optional(),
  PalletTotalQty: z.union([z.string(), z.number(), z.null()]).optional(),
  palletTotalQty: z.union([z.string(), z.number(), z.null()]).optional(),
  palletTotalqty: z.union([z.string(), z.number(), z.null()]).optional(),
  TotalPalletCount: z.union([z.string(), z.number(), z.null()]).optional(),
  totalPalletCount: z.union([z.string(), z.number(), z.null()]).optional(),
  TotalPalletUsedQty: z.union([z.string(), z.number(), z.null()]).optional(),
  totalPalletUsedQty: z.union([z.string(), z.number(), z.null()]).optional(),
  TotalWeight: z.union([z.string(), z.number(), z.null()]).optional(),
  totalWeight: z.union([z.string(), z.number(), z.null()]).optional(),
  TotalHeadPacks: z.union([z.string(), z.number(), z.null()]).optional(),
  totalHeadPacks: z.union([z.string(), z.number(), z.null()]).optional(),
})

type RoomRow = {
  roomCode: string
  palletTotalQty: number
  totalPalletCount: number
  totalPalletUsedQty: number
  totalWeight: number
  totalHeadPacks: number
}

function toNumber(value: unknown): number {
  return Number(value ?? 0)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)
}

function utilization(used: number, total: number): number {
  if (total <= 0) return 0
  return (used / total) * 100
}

function statusColor(rate: number): string {
  if (rate < 50) return "#047857"
  if (rate < 75) return "#b45309"
  return "#be123c"
}

function summarizeUnknown(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value instanceof Error) return value.message || value.name

  if (typeof value === "object") {
    const objectValue = value as { message?: unknown; error?: unknown; detail?: unknown }

    if (typeof objectValue.message === "string" && objectValue.message) {
      return objectValue.message
    }
    if (typeof objectValue.error === "string" && objectValue.error) {
      return objectValue.error
    }
    if (typeof objectValue.detail === "string" && objectValue.detail) {
      return objectValue.detail
    }

    try {
      return JSON.stringify(value)
    } catch {
      return "[unserializable detail]"
    }
  }

  return String(value)
}

function buildEmailHtml(company: string, branch: string, rooms: RoomRow[]): string {
  const totalPallets = rooms.reduce((sum, row) => sum + row.totalPalletCount, 0)
  const usedPallets = rooms.reduce((sum, row) => sum + row.totalPalletUsedQty, 0)
  const totalWeight = rooms.reduce((sum, row) => sum + row.totalWeight, 0)
  const totalHeadsPacks = rooms.reduce((sum, row) => sum + row.totalHeadPacks, 0)
  const totalBarcodeQty = rooms.reduce((sum, row) => sum + row.palletTotalQty, 0)
  const overallRate = utilization(usedPallets, totalPallets)
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(new Date())

  const rowsHtml =
    rooms.length === 0
      ? `<tr><td colspan="5" style="padding:12px;text-align:center;color:#6b7280;">No room data available.</td></tr>`
      : rooms
          .map((room) => {
            const rate = utilization(room.totalPalletUsedQty, room.totalPalletCount)
            return `<tr>
<td style="padding:8px;border-top:1px solid #e5e7eb;">${room.roomCode}</td>
<td style="padding:8px;border-top:1px solid #e5e7eb;text-align:right;">${formatNumber(room.totalPalletCount)}</td>
<td style="padding:8px;border-top:1px solid #e5e7eb;text-align:right;">${formatNumber(room.totalPalletUsedQty)}</td>
<td style="padding:8px;border-top:1px solid #e5e7eb;text-align:right;">${formatNumber(room.totalWeight)}</td>
<td style="padding:8px;border-top:1px solid #e5e7eb;text-align:right;color:${statusColor(rate)};font-weight:600;">${formatNumber(rate)}%</td>
</tr>`
          })
          .join("")

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f8fafc;color:#111827;font-family:Arial,sans-serif;">
    <div style="max-width:900px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
      <h1 style="margin:0 0 8px 0;font-size:24px;">Daily Pallet Utilization</h1>
      <p style="margin:0;color:#4b5563;font-size:14px;">ICS Inventory Dashboard | ${company.toUpperCase()} / ${branch.toUpperCase()}</p>
      <p style="margin:4px 0 0 0;color:#4b5563;font-size:14px;">As of ${dateLabel}</p>

      <div style="margin-top:16px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:10px;color:#4b5563;">Total Pallets</td>
            <td style="padding:10px;text-align:right;font-weight:600;">${formatNumber(totalPallets)}</td>
          </tr>
          <tr>
            <td style="padding:10px;border-top:1px solid #e5e7eb;color:#4b5563;">Used Pallets</td>
            <td style="padding:10px;border-top:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatNumber(usedPallets)}</td>
          </tr>
          <tr>
            <td style="padding:10px;border-top:1px solid #e5e7eb;color:#4b5563;">Total Weight</td>
            <td style="padding:10px;border-top:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatNumber(totalWeight)} kg</td>
          </tr>
          <tr>
            <td style="padding:10px;border-top:1px solid #e5e7eb;color:#4b5563;">Total Heads/Packs</td>
            <td style="padding:10px;border-top:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatNumber(totalHeadsPacks)}</td>
          </tr>
          <tr>
            <td style="padding:10px;border-top:1px solid #e5e7eb;color:#4b5563;">Total Barcode Qty</td>
            <td style="padding:10px;border-top:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatNumber(totalBarcodeQty)}</td>
          </tr>
          <tr>
            <td style="padding:10px;border-top:1px solid #e5e7eb;color:#4b5563;">Overall Utilization</td>
            <td style="padding:10px;border-top:1px solid #e5e7eb;text-align:right;font-weight:600;color:${statusColor(overallRate)};">${formatNumber(overallRate)}%</td>
          </tr>
        </table>
      </div>

      <div style="margin-top:16px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead style="background:#f9fafb;">
            <tr>
              <th style="padding:8px;text-align:left;">Room</th>
              <th style="padding:8px;text-align:right;">Total Pallets</th>
              <th style="padding:8px;text-align:right;">Used Pallets</th>
              <th style="padding:8px;text-align:right;">Weight (kg)</th>
              <th style="padding:8px;text-align:right;">Utilization</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>
  </body>
</html>`
}

async function sendViaResend({
  apiKey,
  from,
  to,
  subject,
  html,
}: {
  apiKey: string
  from: string
  to: string[]
  subject: string
  html: string
}): Promise<{ ok: boolean; detail?: unknown; id?: string }> {
  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  })

  const raw = await resendRes.text()
  let parsed: unknown = null
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = raw
  }

  if (!resendRes.ok) {
    return { ok: false, detail: summarizeUnknown(parsed) || `Resend HTTP ${resendRes.status}` }
  }

  return { ok: true, id: (parsed as { id?: string } | null)?.id }
}

async function sendViaSmtp({
  host,
  port,
  secure,
  user,
  pass,
  from,
  to,
  subject,
  html,
}: {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  to: string[]
  subject: string
  html: string
}): Promise<{ ok: boolean; detail?: unknown; id?: string }> {
  let nodemailer: unknown
  try {
    nodemailer = await import("nodemailer")
  } catch {
    return {
      ok: false,
      detail: "nodemailer is not installed. Run: npm i nodemailer",
    }
  }

  try {
    const moduleLike = nodemailer as {
      createTransport?: (config: unknown) => { sendMail: (mail: unknown) => Promise<{ messageId?: string }> }
      default?: {
        createTransport?: (config: unknown) => { sendMail: (mail: unknown) => Promise<{ messageId?: string }> }
      }
    }
    const createTransport = moduleLike.createTransport ?? moduleLike.default?.createTransport

    if (!createTransport) {
      return { ok: false, detail: "nodemailer createTransport is unavailable." }
    }

    const transporter = createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    })

    return { ok: true, id: info.messageId }
  } catch (err) {
    return { ok: false, detail: summarizeUnknown(err) }
  }
}

export async function POST(req: Request) {
  try {
    const bodyUnknown = await req.json().catch(() => ({}))
    const body = requestSchema.safeParse(bodyUnknown)
    if (!body.success) {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 })
    }

    const company = body.data.company ?? process.env.PHP_COMPANY ?? ""
    const branch = body.data.branch ?? process.env.PHP_BRANCH ?? ""
    if (!company || !branch) {
      return NextResponse.json({ message: "Missing company/branch" }, { status: 400 })
    }

    const smtpHost = process.env.SMTP_HOST ?? ""
    const smtpPort = Number(process.env.SMTP_PORT ?? "465")
    const smtpSecure = String(process.env.SMTP_SECURE ?? "true").toLowerCase() === "true"
    const smtpUser = process.env.SMTP_USER ?? ""
    const smtpPass = process.env.SMTP_PASS ?? ""
    const smtpFrom = process.env.SMTP_FROM ?? ""
    const smtpTo = process.env.SMTP_TO ?? ""

    const resendApiKey = process.env.RESEND_API_KEY ?? ""
    const resendFrom = process.env.RESEND_FROM ?? ""
    const resendTo = process.env.RESEND_TO ?? ""

    const roomsResult = await callPhp({
      payload: {
        type: "fetchroomsummary",
        company,
        branch,
      },
    })
    if (!roomsResult.ok) {
      return NextResponse.json(
        { message: "Failed to load room data for email.", error: roomsResult.error },
        { status: 502 }
      )
    }

    const rawRows = extractPhpRows(roomsResult.parsed)
    const parsedRows = z.array(roomApiRowSchema).safeParse(rawRows)
    if (!parsedRows.success) {
      return NextResponse.json({ message: "Room data shape invalid for email." }, { status: 502 })
    }

    const rooms: RoomRow[] = parsedRows.data.map((r) => ({
      roomCode: r.RoomCode ?? r.roomCode ?? "",
      palletTotalQty: toNumber(r.BarcodeTotalQty ?? r.barcodeTotalQty ?? r.PalletTotalQty ?? r.palletTotalQty ?? r.palletTotalqty),
      totalPalletCount: toNumber(r.TotalPalletCount ?? r.totalPalletCount),
      totalPalletUsedQty: toNumber(r.TotalPalletUsedQty ?? r.totalPalletUsedQty),
      totalWeight: toNumber(r.TotalWeight ?? r.totalWeight),
      totalHeadPacks: toNumber(r.TotalHeadPacks ?? r.totalHeadPacks),
    }))

    const html = buildEmailHtml(company, branch, rooms)
    const subject = `Daily Pallet Utilization - ${branch.toUpperCase()} - ${new Date().toLocaleDateString("en-US")}`
    const hasSmtp = Boolean(smtpHost && smtpUser && smtpPass && smtpFrom && smtpTo)

    if (hasSmtp) {
      const smtpResult = await sendViaSmtp({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
        to: smtpTo.split(",").map((s) => s.trim()).filter(Boolean),
        subject,
        html,
      })

      if (!smtpResult.ok) {
        return NextResponse.json(
          { message: "SMTP send failed", detail: summarizeUnknown(smtpResult.detail) },
          { status: 502 }
        )
      }

      return NextResponse.json({ ok: true, message: "Sample email sent via SMTP.", id: smtpResult.id })
    }

    if (!resendApiKey || resendApiKey.includes("xxxxx")) {
      return NextResponse.json({ message: "RESEND_API_KEY is missing or placeholder." }, { status: 400 })
    }
    if (!resendFrom || resendFrom.includes("your-verified-domain")) {
      return NextResponse.json({ message: "RESEND_FROM is not configured with a verified sender." }, { status: 400 })
    }
    if (!resendTo) {
      return NextResponse.json({ message: "RESEND_TO is missing." }, { status: 400 })
    }

    const resendResult = await sendViaResend({
      apiKey: resendApiKey,
      from: resendFrom,
      to: resendTo.split(",").map((s) => s.trim()).filter(Boolean),
      subject,
      html,
    })

    if (!resendResult.ok) {
      return NextResponse.json(
        { message: "Resend request failed", detail: summarizeUnknown(resendResult.detail) },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true, message: "Sample email sent via Resend.", id: resendResult.id })
  } catch (err) {
    const message = summarizeUnknown(err)
    return NextResponse.json({ message: "Failed to send sample email", error: message }, { status: 500 })
  }
}
