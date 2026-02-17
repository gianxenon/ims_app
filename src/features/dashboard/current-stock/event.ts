import type { CurrentStockRow, Filters } from "./types"

export type CurrentStockEvent =
  | { type: "FETCH_STARTED" }
  | { type: "FETCH_SUCCEEDED"; rows: CurrentStockRow[]; lastUpdated: string }
  | { type: "FETCH_FAILED"; message: string }
  | { type: "SET_FILTERS"; filters: Filters }
  | { type: "SET_SHOW_MAIN_FILTERS"; value: boolean }
  | { type: "SET_SHOW_ADVANCED"; value: boolean }
  | { type: "SET_PAGE_SIZE"; value: number }
  | { type: "SET_PAGE_INDEX"; value: number }
