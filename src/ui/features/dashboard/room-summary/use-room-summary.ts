"use client"

import * as React from "react"
import { loadRoomSummary } from "@/src/application/use-cases/dashboard/room-summary"
import type { RoomSummaryFilters } from "@/src/application/dto/dashboard/room-summary"
import { initialRoomSummaryState, roomSummaryReducer } from "@/src/ui/features/dashboard/room-summary/state"

// UI hook that keeps room summary fresh on an interval.
export function useRoomSummary(company: string, branch: string, filters?: RoomSummaryFilters) {
  const [state, dispatch] = React.useReducer(roomSummaryReducer, initialRoomSummaryState)
  const hasBranchContext = company.trim().length > 0 && branch.trim().length > 0

  React.useEffect(() => {
    if (!hasBranchContext) return

    let mounted = true

    const run = async () => {
      if (!mounted) return
      dispatch({ type: "FETCH_STARTED" })
      const result = await loadRoomSummary(company, branch, filters)
      if (!mounted) return
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

    void run()
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void run()
    }, 10000)

    return () => {
      mounted = false
      window.clearInterval(id)
    }
  }, [company, branch, filters, hasBranchContext])

  if (!hasBranchContext) {
    return {
      ...state,
      rooms: null,
      error: null,
      lastUpdated: "",
    }
  }

  return state
}
