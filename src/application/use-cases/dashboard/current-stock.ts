import type { Dispatch } from "react"

import { fetchCurrentStock } from "@/src/infrastructure/data-sources/dashboard/current-stock"
import type { CurrentStockEvent } from "@/src/application/events/dashboard/current-stock"
import type { Filters } from "@/src/application/dto/dashboard/current-stock"

// Application use-case for loading current stock and notifying UI state.
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

  // Apply UI-facing filter locally to avoid another API call.
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
