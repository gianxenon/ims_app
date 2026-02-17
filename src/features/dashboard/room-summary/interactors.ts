import type { Dispatch } from "react"
import { fetchRoomSummary } from "./data-source"
import type { RoomSummaryEvent } from "./event"

export async function loadRoomSummary(
  dispatch: Dispatch<RoomSummaryEvent>,
  company: string,
  branch: string
) {
  dispatch({ type: "FETCH_STARTED" })
  const result = await fetchRoomSummary(company, branch)
  if (!result.ok) {
    dispatch({ type: "FETCH_FAILED", message: result.message })
    return
  }
  dispatch({
    type: "FETCH_SUCCEEDED",
    rooms: result.rooms,
    lastUpdated: new Date().toLocaleTimeString("en-US", { hour12: true }),
  })
}
