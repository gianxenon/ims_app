"use client"

import type { ReactNode } from "react"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import type { Column } from "./ui-types"

type LookupModalProps<TRow> = {
  open: boolean
  title: string
  rows: TRow[]
  columns: Column<TRow>[]
  rowKey: (row: TRow) => string
  onSelect: (row: TRow) => void
  onClose: () => void
  emptyText?: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export function LookupModal<TRow>({
  open,
  title,
  rows,
  columns,
  rowKey,
  onSelect,
  onClose,
  emptyText = "No results found.",
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  page,
  totalPages,
  onPageChange,
}: LookupModalProps<TRow>) {
  if (!open) return null

  const showPager = typeof page === "number" && typeof totalPages === "number" && totalPages > 1

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background w-full max-w-3xl overflow-hidden rounded-lg border shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {onSearchChange ? (
            <div className="px-3 py-2">
              <Input
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
          ) : null}
          <div className={`grid gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide ${gridTemplate(columns)}`}>
            {columns.map((col) => (
              <div key={col.key}>{col.header}</div>
            ))}
          </div>
          {rows.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground">{emptyText}</div>
          ) : (
            rows.map((row, index) => (
              <button
                key={rowKey(row)}
                type="button"
                className={`hover:bg-accent grid w-full gap-2 rounded-md px-3 py-2 text-left text-sm ${gridTemplate(columns)}`}
                onClick={() => onSelect(row)}
              >
                {columns.map((col) => (
                  <span key={col.key} className={col.className}>
                    {col.render
                      ? col.render(row, index)
                      : ((row as Record<string, unknown>)[col.key] as ReactNode)}
                  </span>
                ))}
              </button>
            ))
          )}
          {showPager ? (
            <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(Math.max(1, (page ?? 1) - 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(Math.min(totalPages ?? 1, (page ?? 1) + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function gridTemplate<TRow>(columns: Column<TRow>[]) {
  if (columns.length === 1) return "grid-cols-[1fr]"
  if (columns.length === 2) return "grid-cols-[180px_1fr]"
  if (columns.length === 3) return "grid-cols-[160px_1fr_180px]"
  return `grid-cols-[repeat(${columns.length},minmax(0,1fr))]`
}
