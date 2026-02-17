"use client"

import * as React from "react"
import { loadRoomSummary } from "./interactors"
import { initialRoomSummaryState, roomSummaryReducer } from "./state"

export function useRoomSummary(company: string, branch: string) {
  const [state, dispatch] = React.useReducer(roomSummaryReducer, initialRoomSummaryState)

  React.useEffect(() => {
    let mounted = true

    const run = async () => {
      if (!mounted) return
      await loadRoomSummary(dispatch, company, branch)
    }

    void run()
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void run()
    }, 10000)

    return () => {
      mounted = false
      window.clearInterval(id)
    }
  }, [company, branch])

  return state
}
