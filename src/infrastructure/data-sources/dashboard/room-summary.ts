import type { RoomCard, RoomSummaryFilters } from "@/src/application/dto/dashboard/room-summary"
import { requireBranchContext } from "@/src/infrastructure/data-sources/shared/branch-context"

// Infrastructure data source: call Next.js API for room summary.
function toNumber(v: unknown): number {
  return Number(v ?? 0)
}

export async function fetchRoomSummary(
  company: string,
  branch: string,
  filters?: RoomSummaryFilters
): Promise<{ ok: true; rooms: RoomCard[] } | { ok: false; message: string }> {
  const ctx = requireBranchContext(company, branch)
  if (!ctx.ok) return { ok: false, message: ctx.message }

  try {
    const qs = new URLSearchParams({ company: ctx.company, branch: ctx.branch })
    if (filters?.customerNo) qs.set("customerNo", filters.customerNo)
    if (filters?.itemNo) qs.set("itemNo", filters.itemNo)
    if (filters?.batch) qs.set("batch", filters.batch)
    if (filters?.location) qs.set("location", filters.location)

    const res = await fetch(`/api/rooms?${qs.toString()}`, { cache: "no-store" })
    if (!res.ok) return { ok: false, message: "Room summary fetch failed." }

    const payload = (await res.json()) as { rooms?: Array<Record<string, unknown>> }
    // Normalize API payload into typed RoomCard objects.
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
