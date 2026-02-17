"use client"

import * as React from "react"
import { toast } from "sonner"

import { loadCurrentStock } from "./interactors"
import { currentStockReducer, defaultFilters, initialCurrentStockState } from "./state"
import type { CurrentStockRow, Filters } from "./types"

function csvEscape(value: unknown): string {
  const s = String(value ?? "")
  if (s.includes("\"") || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, "\"\"")}"`
  }
  return s
}

export function useCurrentStock(company: string, branch: string, initialData: CurrentStockRow[] = []) {
  const [state, dispatch] = React.useReducer(currentStockReducer, {
    ...initialCurrentStockState,
    rows: initialData,
  })
  const numberFormatter = React.useMemo(() => new Intl.NumberFormat("en-US"), [])
  const hadFetchErrorRef = React.useRef(false)

  React.useEffect(() => {
    const timer = window.setTimeout(async () => {
      const result = await loadCurrentStock(dispatch, company, branch, state.filters)

      if (!result.ok) {
        if (!hadFetchErrorRef.current) {
          hadFetchErrorRef.current = true
          toast.error("Inventory fetch failed. Retrying...")
        }
        return
      }

      if (hadFetchErrorRef.current) {
        hadFetchErrorRef.current = false
        toast.success("Inventory connection restored.")
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [company, branch, state.filters])

  const setFilters = React.useCallback(
    (next: React.SetStateAction<Filters>) => {
      const filters = typeof next === "function" ? next(state.filters) : next
      dispatch({ type: "SET_FILTERS", filters })
    },
    [state.filters]
  )

  const setShowMainFilters = React.useCallback(
    (next: React.SetStateAction<boolean>) => {
      const value = typeof next === "function" ? next(state.showMainFilters) : next
      dispatch({ type: "SET_SHOW_MAIN_FILTERS", value })
    },
    [state.showMainFilters]
  )

  const setShowAdvanced = React.useCallback(
    (next: React.SetStateAction<boolean>) => {
      const value = typeof next === "function" ? next(state.showAdvanced) : next
      dispatch({ type: "SET_SHOW_ADVANCED", value })
    },
    [state.showAdvanced]
  )

  const setPageSize = React.useCallback(
    (next: React.SetStateAction<number>) => {
      const value = typeof next === "function" ? next(state.pageSize) : next
      dispatch({ type: "SET_PAGE_SIZE", value })
    },
    [state.pageSize]
  )

  const setPageIndex = React.useCallback(
    (next: React.SetStateAction<number>) => {
      const value = typeof next === "function" ? next(state.pageIndex) : next
      dispatch({ type: "SET_PAGE_INDEX", value })
    },
    [state.pageIndex]
  )

  const resetFilters = React.useCallback(() => {
    dispatch({ type: "SET_FILTERS", filters: { ...defaultFilters } })
  }, [])

  const totalPages = Math.max(1, Math.ceil(state.rows.length / state.pageSize))
  const safePageIndex = Math.min(state.pageIndex, totalPages - 1)
  const pageStart = safePageIndex * state.pageSize
  const pageRows = state.rows.slice(pageStart, pageStart + state.pageSize)
  const isDetailed = state.filters.showdetails === "1"
  const totalHeadsPacks = state.rows.reduce((sum, row) => sum + row.headsPacks, 0)
  const totalQuantity = state.rows.reduce((sum, row) => sum + row.quantity, 0)
  const totalWeight = state.rows.reduce((sum, row) => sum + row.weight, 0)

  const handleDownloadCsv = React.useCallback(() => {
    const headers = [
      "Rec Date",
      "Location",
      "Item No",
      "Item Name",
      "Batch",
      ...(isDetailed ? ["Barcode"] : []),
      "PD",
      "ED",
      "Heads/Packs",
      "Qty",
      "Weight",
      "UOM",
      "Status",
    ]

    const body = state.rows.map((row) => [
      row.recDate,
      row.location,
      row.itemNo,
      row.itemName,
      row.batch,
      ...(isDetailed ? [row.barcode] : []),
      row.pd,
      row.ed,
      row.headsPacks,
      row.quantity,
      row.weight,
      row.uom,
      row.expiryStatus,
    ])

    const csv = [headers.map(csvEscape).join(","), ...body.map((line) => line.map(csvEscape).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `current-stock-${company}-${branch}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }, [state.rows, isDetailed, company, branch])

  return {
    filters: state.filters,
    setFilters,
    resetFilters,
    showMainFilters: state.showMainFilters,
    setShowMainFilters,
    showAdvanced: state.showAdvanced,
    setShowAdvanced,
    rows: state.rows,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    pageSize: state.pageSize,
    setPageSize,
    pageIndex: state.pageIndex,
    setPageIndex,
    numberFormatter,
    totalPages,
    safePageIndex,
    pageRows,
    isDetailed,
    totalHeadsPacks,
    totalQuantity,
    totalWeight,
    handleDownloadCsv,
  }
}
