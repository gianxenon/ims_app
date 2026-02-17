import type { RoomSummaryEvent } from "./event"
import type { RoomCard } from "./types"

export type RoomSummaryState = {
  rooms: RoomCard[] | null
  loading: boolean
  error: string | null
  lastUpdated: string
}

export const initialRoomSummaryState: RoomSummaryState = {
  rooms: null,
  loading: true,
  error: null,
  lastUpdated: "",
}

export function roomSummaryReducer(state: RoomSummaryState, event: RoomSummaryEvent): RoomSummaryState {
  switch (event.type) {
    case "FETCH_STARTED":
      return { ...state, loading: true, error: null }
    case "FETCH_SUCCEEDED":
      return { rooms: event.rooms, loading: false, error: null, lastUpdated: event.lastUpdated }
    case "FETCH_FAILED":
      return { ...state, loading: false, error: event.message, rooms: state.rooms ?? [] }
    default:
      return state
  }
}
