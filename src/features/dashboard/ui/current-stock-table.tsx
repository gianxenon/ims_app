"use client"

import { RotateCcw } from "lucide-react"
import { useCurrentStock } from "@/src/features/dashboard/current-stock/use-current-stock"
import type { CurrentStockRow, Filters } from "@/src/features/dashboard/current-stock/types"

import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"

function statusBadgeClass(status: CurrentStockRow["expiryStatus"]): string {
  if (status === "GOOD") return "bg-emerald-600 text-white border-transparent"
  if (status === "NEAR EXPIRY") return "bg-amber-500 text-white border-transparent"
  return "bg-rose-600 text-white border-transparent"
}

export function CurrentStockTable({
  company,
  branch,
  initialData = [],
}: {
  company: string
  branch: string
  initialData?: CurrentStockRow[]
}) {
  const {
    filters,
    setFilters,
    resetFilters,
    showMainFilters,
    setShowMainFilters,
    showAdvanced,
    setShowAdvanced,
    rows,
    loading,
    pageSize,
    setPageSize,
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
  } = useCurrentStock(company, branch, initialData)

  return (
    <Tabs defaultValue="current-stock" className="w-full flex-col gap-4">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="current-stock">Stock Status</TabsTrigger>
          <TabsTrigger value="stock-ledger">Stock Ledger</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="current-stock" className="space-y-3">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={() => setShowMainFilters((s) => !s)}>
            {showMainFilters ? "Hide Main Filters" : "Show Main Filters"}
          </Button>
        </div>

        {showMainFilters && (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="space-y-1">
            <Label>Show</Label>
            <Select
              value={filters.showdetails}
              onValueChange={(v) => setFilters((p) => ({ ...p, showdetails: v as "0" | "1" }))}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Summary</SelectItem>
                <SelectItem value="1">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="itemno">Item</Label>
            <Input
              id="itemno"
              className="h-8"
              placeholder="Item no/name"
              value={filters.itemno}
              onChange={(e) => setFilters((p) => ({ ...p, itemno: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="batch">Batch</Label>
            <Input
              id="batch"
              className="h-8"
              placeholder="Batch"
              value={filters.batch}
              onChange={(e) => setFilters((p) => ({ ...p, batch: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              className="h-8"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((p) => ({ ...p, status: v as Filters["status"] }))}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="GOOD">GOOD</SelectItem>
                <SelectItem value="NEAR EXPIRY">NEAR EXPIRY</SelectItem>
                <SelectItem value="EXPIRED">EXPIRED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>With Pendings</Label>
            <Select
              value={filters.withpendings}
              onValueChange={(v) => setFilters((p) => ({ ...p, withpendings: v as "0" | "1" }))}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Yes</SelectItem>
                <SelectItem value="0">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="rec_from">Rec Date From</Label>
            <Input
              id="rec_from"
              type="date"
              className="h-8"
              value={filters.rec_from}
              onChange={(e) => setFilters((p) => ({ ...p, rec_from: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="rec_to">Rec Date To</Label>
            <Input
              id="rec_to"
              type="date"
              className="h-8"
              value={filters.rec_to}
              onChange={(e) => setFilters((p) => ({ ...p, rec_to: e.target.value }))}
            />
          </div>
          </div>
        )}

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-2 rounded-md border p-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="tagno">Tag No</Label>
              <Input
                id="tagno"
                className="h-8"
                value={filters.tagno}
                onChange={(e) => setFilters((p) => ({ ...p, tagno: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="receivedtype">Received Type</Label>
              <Input
                id="receivedtype"
                className="h-8"
                value={filters.receivedtype}
                onChange={(e) => setFilters((p) => ({ ...p, receivedtype: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="custno">Customer No</Label>
              <Input
                id="custno"
                className="h-8"
                value={filters.custno}
                onChange={(e) => setFilters((p) => ({ ...p, custno: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prd_from">Prod Date From</Label>
              <Input
                id="prd_from"
                type="date"
                className="h-8"
                value={filters.prd_from}
                onChange={(e) => setFilters((p) => ({ ...p, prd_from: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prd_to">Prod Date To</Label>
              <Input
                id="prd_to"
                type="date"
                className="h-8"
                value={filters.prd_to}
                onChange={(e) => setFilters((p) => ({ ...p, prd_to: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="exp_from">Exp Date From</Label>
              <Input
                id="exp_from"
                type="date"
                className="h-8"
                value={filters.exp_from}
                onChange={(e) => setFilters((p) => ({ ...p, exp_from: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="exp_to">Exp Date To</Label>
              <Input
                id="exp_to"
                type="date"
                className="h-8"
                value={filters.exp_to}
                onChange={(e) => setFilters((p) => ({ ...p, exp_to: e.target.value }))}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAdvanced((s) => !s)}>
            {showAdvanced ? "Hide More Filters" : "More Filters"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadCsv} disabled={rows.length === 0}>
            Download CSV
          </Button>
          <Button variant="ghost" size="icon" onClick={resetFilters} aria-label="Reset filters" title="Reset filters">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-130 overflow-y-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rec Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Item No</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Batch</TableHead>
                {isDetailed && <TableHead>Barcode</TableHead>}
                <TableHead>PD</TableHead>
                <TableHead>ED</TableHead>
                <TableHead className="text-right">Heads/Packs</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isDetailed ? 13 : 12} className="h-20 text-center text-sm">
                    {loading ? (
                      <div className="mx-auto w-full max-w-sm">
                        <div className="text-muted-foreground mb-2 text-xs">Loading inventory...</div>
                        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                          <div className="bg-primary h-2 w-1/2 animate-pulse rounded-full" />
                        </div>
                      </div>
                    ) : (
                      "No inventory rows found."
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.recDate}</TableCell>
                    <TableCell>{row.location}</TableCell>
                    <TableCell>{row.itemNo}</TableCell>
                    <TableCell>{row.itemName}</TableCell>
                    <TableCell>{row.batch}</TableCell>
                    {isDetailed && <TableCell>{row.barcode}</TableCell>}
                    <TableCell>{row.pd}</TableCell>
                    <TableCell>{row.ed}</TableCell>
                    <TableCell className="text-right">{numberFormatter.format(row.headsPacks)}</TableCell>
                    <TableCell className="text-right">{numberFormatter.format(row.quantity)}</TableCell>
                    <TableCell className="text-right">{numberFormatter.format(row.weight)}</TableCell>
                    <TableCell>{row.uom}</TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(row.expiryStatus)}>{row.expiryStatus}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-muted-foreground text-sm">
          Rows: {numberFormatter.format(rows.length)} | Totals: Heads/Packs {numberFormatter.format(totalHeadsPacks)} | Qty {numberFormatter.format(totalQuantity)} | Weight {numberFormatter.format(totalWeight)}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Label htmlFor="rows-per-page">Rows</Label>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger id="rows-per-page" className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground text-sm">
            Page {safePageIndex + 1} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={safePageIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePageIndex >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="stock-ledger" className="space-y-3">
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Stock Ledger tab is ready. Ledger table and filters will be added here.
        </div>
      </TabsContent>
    </Tabs>
  )
}
