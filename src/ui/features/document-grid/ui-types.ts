import type * as React from "react"

export type Column<T> = {
  key: string
  header: string
  className?: string
  cellClassName?: string
  render?: (row: T, index: number) => React.ReactNode
}

export type RowAction<T> = {
  id: string
  label: string
  onClick: (row: T) => void
  disabled?: (row: T) => boolean
}
