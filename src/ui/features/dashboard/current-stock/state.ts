import type { CurrentStockEvent } from "@/src/application/events/dashboard/current-stock"
import type { CurrentStockRow, Filters } from "@/src/application/dto/dashboard/current-stock"

// UI defaults for current stock filters.
export const defaultFilters: Filters = {
  showdetails: "0",
  withpendings: "0",
  itemno: "",
  batch: "",
  location: "",
  status: "all",
  tagno: "",
  receivedtype: "",
  custno: "",
  prd_from: "",
  prd_to: "",
  exp_from: "",
  exp_to: "",
  rec_from: "",
  rec_to: "",
}

export type CurrentStockState = {
  rows: CurrentStockRow[]
  loading: boolean
  error: string | null
  lastUpdated: string
  filters: Filters
  showMainFilters: boolean
  showAdvanced: boolean
  pageSize: number
  pageIndex: number
}

export const initialCurrentStockState: CurrentStockState = {
  rows: [],
  loading: false,
  error: null,
  lastUpdated: "",
  filters: defaultFilters,
  showMainFilters: true,
  showAdvanced: false,
  pageSize: 10,
  pageIndex: 0,
}

export function currentStockReducer(state: CurrentStockState, event: CurrentStockEvent): CurrentStockState {
  switch (event.type) {
    case "FETCH_STARTED":
      return { ...state, loading: true, error: null }
    case "FETCH_SUCCEEDED":
      return {
        ...state,
        rows: event.rows,
        loading: false,
        error: null,
        lastUpdated: event.lastUpdated,
        pageIndex: 0,
      }
    case "FETCH_FAILED":
      return { ...state, loading: false, error: event.message }
    case "SET_FILTERS":
      return { ...state, filters: event.filters, pageIndex: 0 }
    case "SET_SHOW_MAIN_FILTERS":
      return { ...state, showMainFilters: event.value }
    case "SET_SHOW_ADVANCED":
      return { ...state, showAdvanced: event.value }
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: Math.max(1, event.value), pageIndex: 0 }
    case "SET_PAGE_INDEX":
      return { ...state, pageIndex: Math.max(0, event.value) }
    default:
      return state
  }
}
