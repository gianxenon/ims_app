import type { RoomCard } from "@/src/application/dto/dashboard/room-summary"

// Events emitted by room summary use-cases and consumed by UI reducers.
export type RoomSummaryEvent =
  | { type: "FETCH_STARTED" }
  | { type: "FETCH_SUCCEEDED"; rooms: RoomCard[]; lastUpdated: string }
  | { type: "FETCH_FAILED"; message: string }
