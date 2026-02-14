"use client"

import * as React from "react"
import { RotateCcw } from "lucide-react"

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

export type CurrentStockRow = {
  id: number
  recDate: string
  custNo: string
  custName: string
  receivedType: string
  itemNo: string
  itemName: string
  batch: string
  barcode: string
  location: string
  headsPacks: number
  quantity: number
  weight: number
  uom: string
  pd: string
  ed: string
  expiryStatus: "GOOD" | "NEAR EXPIRY" | "EXPIRED"
}

type Filters = {
  showdetails: "0" | "1"
  withpendings: "0" | "1"
  itemno: string
  batch: string
  location: string
  status: "all" | "GOOD" | "NEAR EXPIRY" | "EXPIRED"
  tagno: string
  receivedtype: string
  custno: string
  prd_from: string
  prd_to: string
  exp_from: string
  exp_to: string
  rec_from: string
  rec_to: string
}

const defaultFilters: Filters = {
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

function statusBadgeClass(status: CurrentStockRow["expiryStatus"]): string {
  if (status === "GOOD") return "bg-emerald-600 text-white border-transparent"
  if (status === "NEAR EXPIRY") return "bg-amber-500 text-white border-transparent"
  return "bg-rose-600 text-white border-transparent"
}

function buildUrl(basePath: string, company: string, branch: string, f: Filters): string {
  const p = new URLSearchParams({
    company,
    branch,
    showdetails: f.showdetails,
    withpendings: f.withpendings,
    itemno: f.itemno,
    batch: f.batch,
    location: f.location,
    tagno: f.tagno,
    receivedtype: f.receivedtype,
    custno: f.custno,
    prd_from: f.prd_from,
    prd_to: f.prd_to,
    exp_from: f.exp_from,
    exp_to: f.exp_to,
    rec_from: f.rec_from,
    rec_to: f.rec_to,
  })
  return `${basePath}?${p.toString()}`
}

function csvEscape(value: unknown): string {
  const s = String(value ?? "")
  if (s.includes("\"") || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, "\"\"")}"`
  }
  return s
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
  const [filters, setFilters] = React.useState<Filters>(defaultFilters)
  const [showMainFilters, setShowMainFilters] = React.useState(true)
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const [rows, setRows] = React.useState<CurrentStockRow[]>(initialData)
  const [loading, setLoading] = React.useState(false)
  const [pageSize, setPageSize] = React.useState(10)
  const [pageIndex, setPageIndex] = React.useState(0)

  React.useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(buildUrl("/api/inventory-table", company, branch, filters), {
          cache: "no-store",
        })

        if (!res.ok) {
          setRows([])
          return
        }

        const payload = (await res.json()) as { data?: CurrentStockRow[] }
        const fromApi = payload.data ?? []

        const filteredByStatus =
          filters.status === "all"
            ? fromApi
            : fromApi.filter((r) => r.expiryStatus === filters.status)

        setRows(filteredByStatus)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(t)
  }, [company, branch, filters])

  React.useEffect(() => {
    setPageIndex(0)
  }, [rows, pageSize])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePageIndex = Math.min(pageIndex, totalPages - 1)
  const pageStart = safePageIndex * pageSize
  const pageRows = rows.slice(pageStart, pageStart + pageSize)
  const isDetailed = filters.showdetails === "1"
  const totalHeadsPacks = rows.reduce((sum, row) => sum + row.headsPacks, 0)
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0)
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0)

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

    const body = rows.map((row) => [
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

    const csv = [
      headers.map(csvEscape).join(","),
      ...body.map((line) => line.map(csvEscape).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `current-stock-${company}-${branch}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [rows, isDetailed, company, branch])

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
          <Button variant="ghost" size="icon" onClick={() => setFilters(defaultFilters)} aria-label="Reset filters" title="Reset filters">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[520px] overflow-y-auto rounded-lg border">
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
                    {loading ? "Loading inventory..." : "No inventory rows found."}
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
                    <TableCell className="text-right">{row.headsPacks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.weight.toLocaleString()}</TableCell>
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
          Rows: {rows.length.toLocaleString()} | Totals: Heads/Packs {totalHeadsPacks.toLocaleString()} | Qty {totalQuantity.toLocaleString()} | Weight {totalWeight.toLocaleString()}
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
