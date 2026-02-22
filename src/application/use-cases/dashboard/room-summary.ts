import { fetchRoomSummary } from "@/src/infrastructure/data-sources/dashboard/room-summary"
import type { RoomSummaryFilters } from "@/src/application/dto/dashboard/room-summary"
import type { RoomCard } from "@/src/application/dto/dashboard/room-summary"

type LoadRoomSummaryResult = { ok: true; rooms: RoomCard[] } | { ok: false; message: string }

// Application use-case for loading dashboard room summary.
export async function loadRoomSummary(
  company: string,
  branch: string,
  filters?: RoomSummaryFilters
): Promise<LoadRoomSummaryResult> {
  const result = await fetchRoomSummary(company, branch, filters)
  if (!result.ok) {
    return { ok: false, message: result.message }
  }

  return { ok: true, rooms: result.rooms }
}
