import { NextResponse } from "next/server"

type RoomApiRow = {
  RoomCode?: string
  roomCode?: string
  PalletTotalQty?: number | string
  palletTotalqty?: number | string
  palletTotalQty?: number | string
  TotalPalletUsedQty?: number | string
  totalPalletUsedQty?: number | string
  TotalWeight?: number | string
  totalWeight?: number | string
  TotalHeadPacks?: number | string
  totalHeadPacks?: number | string
}

function toNumber(value: unknown): number {
  return Number(value ?? 0)
}

export async function GET(req: Request) {
  try {
    const base = process.env.PHP_API_BASE
    if (!base) {
      return NextResponse.json({ message: "Missing PHP_API_BASE" }, { status: 500 })
    }

    const url = new URL(req.url)
    const company = url.searchParams.get("company") ?? process.env.PHP_COMPANY ?? ""
    const branch = url.searchParams.get("branch") ?? process.env.PHP_BRANCH ?? ""

    if (!company || !branch) {
      return NextResponse.json(
        { message: "Missing company/branch. Pass /api/rooms?company=...&branch=..." },
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
        type: "fetchroomsummary",
        company,
        branch,
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
      ? (parsed as RoomApiRow[])
      : Array.isArray((parsed as { rows?: unknown[] })?.rows)
        ? ((parsed as { rows: RoomApiRow[] }).rows ?? [])
        : []

    const rooms = rows.map((r) => ({
      roomCode: r.RoomCode ?? r.roomCode ?? "",
      palletTotalQty: toNumber(r.PalletTotalQty ?? r.palletTotalQty ?? r.palletTotalqty),
      totalPalletUsedQty: toNumber(r.TotalPalletUsedQty ?? r.totalPalletUsedQty),
      totalWeight: toNumber(r.TotalWeight ?? r.totalWeight),
      totalHeadPacks: toNumber(r.TotalHeadPacks ?? r.totalHeadPacks),
    }))

    if (!phpRes.ok) {
      return NextResponse.json(
        { message: "Room API request failed", raw, rooms },
        { status: phpRes.status }
      )
    }

    return NextResponse.json({ rooms })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Failed to load rooms", error: message }, { status: 500 })
  }
}
