"use client"

import type { Column } from "./ui-types"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"

type DocumentGridTableProps<TDoc> = {
  title: string
  description?: string
  rows: TDoc[]
  totalCount: number
  isLoading?: boolean
  columns: Column<TDoc>[]
  rowKey: (row: TDoc) => string
  onRowClick?: (row: TDoc) => void

  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void

  onCreate?: () => void
  emptyText?: string
  loadingText?: string
}

export function DocumentGridTable<TDoc>({
  title,
  description,
  rows,
  totalCount,
  isLoading,
  columns,
  rowKey,
  onRowClick,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onCreate,
  emptyText = "No documents yet.",
  loadingText = "Loading documents...",
}: DocumentGridTableProps<TDoc>) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {onCreate ? (
            <Button type="button" size="sm" onClick={onCreate}>
              New Document
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-130 overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <p className="text-muted-foreground text-sm">{loadingText}</p>
                  </TableCell>
                </TableRow>
              ) : totalCount === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && totalCount > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-muted-foreground md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="grid-rows">Rows</Label>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger id="grid-rows" className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-center">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center justify-start gap-2 md:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
