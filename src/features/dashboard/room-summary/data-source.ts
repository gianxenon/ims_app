import type { RoomCard } from "./types"

function toNumber(v: unknown): number {
  return Number(v ?? 0)
}

export async function fetchRoomSummary(company: string, branch: string): Promise<{ ok: true; rooms: RoomCard[] } | { ok: false; message: string }> {
  try {
    const res = await fetch(`/api/rooms?company=${encodeURIComponent(company)}&branch=${encodeURIComponent(branch)}`, { cache: "no-store" })
    if (!res.ok) return { ok: false, message: "Room summary fetch failed." }

    const payload = (await res.json()) as { rooms?: Array<Record<string, unknown>> }
    const rooms = (payload.rooms ?? []).map((row) => ({
      roomCode: String(row.roomCode ?? ""),
      palletTotalQty: toNumber(row.palletTotalQty),
      totalPalletCount: toNumber(row.totalPalletCount),
      totalPalletUsedQty: toNumber(row.totalPalletUsedQty),
      totalWeight: toNumber(row.totalWeight),
      totalHeadPacks: toNumber(row.totalHeadPacks),
    }))
    return { ok: true, rooms }
  } catch {
    return { ok: false, message: "Room summary fetch failed." }
  }
}
