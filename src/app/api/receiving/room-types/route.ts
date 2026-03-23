import { NextResponse } from "next/server"

function pickParam(url: URL, key: string): string {
  return url.searchParams.get(key)?.trim() ?? ""
}

function normalizeRoomCode(value: unknown): string {
  return String(value ?? "").trim()
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const company = pickParam(url, "company") || process.env.PHP_COMPANY || ""
  const branch = pickParam(url, "branch") || process.env.PHP_BRANCH || ""

  if (!company || !branch) {
    return NextResponse.json(
      { message: "Missing company/branch. Pass /api/receiving/room-types?company=...&branch=..." },
      { status: 400 }
    )
  }

  const target = new URL("/api/rooms", url.origin)
  target.search = url.searchParams.toString()

  try {
    const res = await fetch(target, { cache: "no-store" })
    const data = await res.json().catch(() => null)

    if (!res.ok) {
      return NextResponse.json(
        data ?? { message: "Room API request failed" },
        { status: res.status }
      )
    }

    const rooms = Array.isArray(data?.rooms) ? data.rooms : []
    const roomTypeCodes: string[] = []
    const seen = new Set<string>()

    for (const room of rooms) {
      const code = normalizeRoomCode(room?.roomCode ?? room?.code)
      if (!code || seen.has(code)) continue
      seen.add(code)
      roomTypeCodes.push(code)
    }

    const roomTypes = roomTypeCodes.map((code) => ({ code }))

    return NextResponse.json({
      roomTypes,
      roomTypeCodes,
      rooms,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { message: "Failed to load room types", error: message },
      { status: 500 }
    )
  }
}
