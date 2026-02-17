import type { RoomCard } from "./types";

export type RoomSummaryEvent =
  | { type: "FETCH_STARTED" }
  | { type: "FETCH_SUCCEEDED"; rooms: RoomCard[]; lastUpdated: string }
  | { type: "FETCH_FAILED"; message: string }
