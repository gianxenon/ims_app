import type { Dispatch } from "react"

import { fetchCurrentStock } from "./data-source"
import type { CurrentStockEvent } from "./event"
import type { Filters } from "./types"

export async function loadCurrentStock(
  dispatch: Dispatch<CurrentStockEvent>,
  company: string,
  branch: string,
  filters: Filters
) {
  dispatch({ type: "FETCH_STARTED" })

  const result = await fetchCurrentStock(company, branch, filters)
  if (!result.ok) {
    dispatch({ type: "FETCH_FAILED", message: result.message })
    return { ok: false as const }
  }

  const rows =
    filters.status === "all"
      ? result.rows
      : result.rows.filter((r) => r.expiryStatus === filters.status)

  dispatch({
    type: "FETCH_SUCCEEDED",
    rows,
    lastUpdated: new Date().toLocaleTimeString("en-US", { hour12: true }),
  })

  return { ok: true as const }
}
