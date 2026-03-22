"use client"

import type { Column, RowAction } from "./ui-types"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"

type LineItemsTableProps<TLine> = {
  title: string
  rows: TLine[]
  columns: Column<TLine>[]
  rowKey: (row: TLine) => string
  rowActions?: RowAction<TLine>[]
  onRowClick?: (row: TLine) => void
  onAddLine?: () => void
  emptyText?: string
  footer?: React.ReactNode
}

export function LineItemsTable<TLine>({
  title,
  rows,
  columns,
  rowKey,
  rowActions,
  onRowClick,
  onAddLine,
  emptyText = "No line items yet.",
  footer,
}: LineItemsTableProps<TLine>) {
  const hasActions = Boolean(rowActions && rowActions.length > 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          {onAddLine ? (
            <Button variant="outline" size="sm" onClick={onAddLine}>
              Add Line
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-105 overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
                {hasActions ? <TableHead className="w-28" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (hasActions ? 1 : 0)} className="h-24 text-center">
                    <p className="text-muted-foreground text-sm">{emptyText}</p>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow
                    key={rowKey(row)}
                    className={onRowClick ? "hover:bg-muted/30 cursor-pointer" : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.cellClassName}>
                        {col.render ? col.render(row, index) : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                      </TableCell>
                    ))}
                    {hasActions ? (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {rowActions?.map((action) => (
                            <Button
                              key={action.id}
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                action.onClick(row)
                              }}
                              disabled={action.disabled?.(row)}
                              aria-label={action.label}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {footer ? <div className="mt-4">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}
