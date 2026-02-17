import { NextResponse } from "next/server"
import { z } from "zod"
import { callPhp, extractPhpRows } from "@/src/lib/php-client"

const roomApiRowSchema = z.looseObject({
    RoomCode: z.string().optional(),
    roomCode: z.string().optional(),
    BarcodeTotalQty: z.union([z.string(), z.number()]).optional(),
    barcodeTotalQty: z.union([z.string(), z.number()]).optional(),
    TotalPalletCount: z.union([z.string(), z.number()]).optional(),
    totalPalletCount: z.union([z.string(), z.number()]).optional(),
    PalletTotalQty: z.union([z.string(), z.number()]).optional(),
    palletTotalqty: z.union([z.string(), z.number()]).optional(),
    palletTotalQty: z.union([z.string(), z.number()]).optional(),
    TotalPalletUsedQty: z.union([z.string(), z.number()]).optional(),
    totalPalletUsedQty: z.union([z.string(), z.number()]).optional(),
    TotalWeight: z.union([z.string(), z.number()]).optional(),
    totalWeight: z.union([z.string(), z.number()]).optional(),
    TotalHeadPacks: z.union([z.string(), z.number()]).optional(),
    totalHeadPacks: z.union([z.string(), z.number()]).optional(),
  })

function toNumber(value: unknown): number {
  return Number(value ?? 0)
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const company = url.searchParams.get("company")  ?? ""
    const branch = url.searchParams.get("branch") ?? ""

    if (!company || !branch) {
      return NextResponse.json(
        { message: "Missing company/branch. Pass /api/rooms?company=...&branch=..." },
        { status: 400 }
      )
    }

    const phpResult = await callPhp({
      payload: {
        type: "fetchroomsummary",
        company,
        branch,
      },
    })

    if (!phpResult.ok) {
      return NextResponse.json(
        { message: "Room API request failed", error: phpResult.error, raw: phpResult.raw },
        { status: phpResult.status }
      )
    }

    const rawRows = extractPhpRows(phpResult.parsed)
    const parsedRows = z.array(roomApiRowSchema).safeParse(rawRows)

    if (!parsedRows.success) {
      return NextResponse.json(
        {
          message: "Room API payload shape invalid",
          issues: parsedRows.error.issues,
        },
        { status: 502 }
      )
    }

    const rooms = parsedRows.data.map((r) => ({
      roomCode: r.RoomCode ?? r.roomCode ?? "",
      palletTotalQty: toNumber(
        r.BarcodeTotalQty ?? r.barcodeTotalQty ?? r.PalletTotalQty ?? r.palletTotalQty ?? r.palletTotalqty
      ),
      totalPalletCount: toNumber(r.TotalPalletCount ?? r.totalPalletCount),
      totalPalletUsedQty: toNumber(r.TotalPalletUsedQty ?? r.totalPalletUsedQty),
      totalWeight: toNumber(r.TotalWeight ?? r.totalWeight),
      totalHeadPacks: toNumber(r.TotalHeadPacks ?? r.totalHeadPacks),
    }))

    return NextResponse.json({ rooms })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Failed to load rooms", error: message }, { status: 500 })
  }
}
