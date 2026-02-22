"use client"

import * as React from "react"
import { MoreHorizontal, RotateCcw } from "lucide-react"
import { useCurrentStock } from "@/src/ui/features/dashboard/current-stock/use-current-stock"
import type { CurrentStockRow, Filters } from "@/src/application/dto/dashboard/current-stock"

import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import type { CustomerOption, ItemOption, LocationOption, PalletAddressOption } from "@/src/shared/options"
import { loadCustomers, loadItems, loadLocations, loadPalletAddresses } from "@/src/application/use-cases/shared/options"
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

// UI table for current stock data.
export function CurrentStockTable({
  company,
  branch,
  initialData = [],
}: {
  company: string
  branch: string
  initialData?: CurrentStockRow[]
}) {
  const pickerPageSize = 10
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

  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false)
  const [itemPickerOpen, setItemPickerOpen] = React.useState(false)
  const [batchPickerOpen, setBatchPickerOpen] = React.useState(false)
  const [locationPickerOpen, setLocationPickerOpen] = React.useState(false)
  const [customerOptions, setCustomerOptions] = React.useState<CustomerOption[]>([])
  const [itemOptions, setItemOptions] = React.useState<ItemOption[]>([])
  const [locationOptions, setLocationOptions] = React.useState<LocationOption[]>([])
  const [palletOptions, setPalletOptions] = React.useState<PalletAddressOption[]>([])
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [itemSearch, setItemSearch] = React.useState("")
  const [batchSearch, setBatchSearch] = React.useState("")
  const [locationSearch, setLocationSearch] = React.useState("")
  const [customerPage, setCustomerPage] = React.useState(1)
  const [itemPage, setItemPage] = React.useState(1)
  const [batchPage, setBatchPage] = React.useState(1)
  const [locationPage, setLocationPage] = React.useState(1)

  const filteredCustomers = React.useMemo(() => {
    const q = customerSearch.trim().toLowerCase()
    if (!q) return customerOptions
    return customerOptions.filter((c) =>
      c.customerNo.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.groupName.toLowerCase().includes(q)
    )
  }, [customerOptions, customerSearch])
  const filteredItems = React.useMemo(() => {
    const q = itemSearch.trim().toLowerCase()
    if (!q) return itemOptions
    return itemOptions.filter((i) =>
      i.itemNo.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q)
    )
  }, [itemOptions, itemSearch])
  const filteredBatches = React.useMemo(() => {
    const q = batchSearch.trim().toLowerCase()
    if (!q) return palletOptions
    return palletOptions.filter((p) => p.code.toLowerCase().includes(q))
  }, [palletOptions, batchSearch])
  const filteredLocations = React.useMemo(() => {
    const q = locationSearch.trim().toLowerCase()
    if (!q) return locationOptions
    return locationOptions.filter((l) => l.code.toLowerCase().includes(q))
  }, [locationOptions, locationSearch])

  const pagedCustomers = filteredCustomers.slice(
    (customerPage - 1) * pickerPageSize,
    customerPage * pickerPageSize
  )
  const pagedItems = filteredItems.slice((itemPage - 1) * pickerPageSize, itemPage * pickerPageSize)
  const pagedBatches = filteredBatches.slice((batchPage - 1) * pickerPageSize, batchPage * pickerPageSize)
  const pagedLocations = filteredLocations.slice(
    (locationPage - 1) * pickerPageSize,
    locationPage * pickerPageSize
  )

  const totalCustomerPages = Math.max(1, Math.ceil(filteredCustomers.length / pickerPageSize))
  const totalItemPages = Math.max(1, Math.ceil(filteredItems.length / pickerPageSize))
  const totalBatchPages = Math.max(1, Math.ceil(filteredBatches.length / pickerPageSize))
  const totalLocationPages = Math.max(1, Math.ceil(filteredLocations.length / pickerPageSize))

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
            <div className="flex gap-2">
              <Input
                id="itemno"
                className="h-8"
                placeholder="Item no/name"
                value={filters.itemno}
                onChange={(e) => setFilters((p) => ({ ...p, itemno: e.target.value }))}
              />
              <Button
                variant="outline"
                size="icon-sm"
                type="button"
                aria-label="Select item"
                title="Select item"
                onClick={async () => {
                  const items = await loadItems(company, branch)
                  if (items.length > 0) setItemOptions(items)
                  setItemSearch("")
                  setItemPage(1)
                  setItemPickerOpen(true)
                }}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="batch">Batch</Label>
            <div className="flex gap-2">
              <Input
                id="batch"
                className="h-8"
                placeholder="Batch"
                value={filters.batch}
                onChange={(e) => setFilters((p) => ({ ...p, batch: e.target.value }))}
              />
              <Button
                variant="outline"
                size="icon-sm"
                type="button"
                aria-label="Select batch"
                title="Select batch"
                onClick={async () => {
                  const pallets = await loadPalletAddresses(company, branch)
                  if (pallets.length > 0) setPalletOptions(pallets)
                  setBatchSearch("")
                  setBatchPage(1)
                  setBatchPickerOpen(true)
                }}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="location">Location</Label>
            <div className="flex gap-2">
              <Input
                id="location"
                className="h-8"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
              />
              <Button
                variant="outline"
                size="icon-sm"
                type="button"
                aria-label="Select location"
                title="Select location"
                onClick={async () => {
                  const locations = await loadLocations(company, branch)
                  if (locations.length > 0) setLocationOptions(locations)
                  setLocationSearch("")
                  setLocationPage(1)
                  setLocationPickerOpen(true)
                }}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
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
            <div className="flex gap-2">
              <Input
                id="custno"
                className="h-8"
                value={filters.custno}
                onChange={(e) => setFilters((p) => ({ ...p, custno: e.target.value }))}
              />
              <Button
                variant="outline"
                size="icon-sm"
                type="button"
                aria-label="Select customer"
                title="Select customer"
                onClick={async () => {
                  const customers = await loadCustomers(company, branch)
                  if (customers.length > 0) setCustomerOptions(customers)
                  setCustomerSearch("")
                  setCustomerPage(1)
                  setCustomerPickerOpen(true)
                }}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
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

      {itemPickerOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-base font-semibold">Select Item</h3>
              <Button variant="outline" size="sm" onClick={() => setItemPickerOpen(false)}>
                Close
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              <div className="px-3 py-2">
                <Input
                  value={itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value)
                    setItemPage(1)
                  }}
                  placeholder="Search item no or item name"
                />
              </div>
              <div className="grid grid-cols-[180px_1fr] gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                <div>Item No</div>
                <div>Item Name</div>
              </div>
              {pagedItems.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">No items found.</div>
              ) : (
                pagedItems.map((item) => (
                  <button
                    key={item.itemNo}
                    type="button"
                    className="hover:bg-accent grid w-full grid-cols-[180px_1fr] gap-2 rounded-md px-3 py-2 text-left text-sm"
                    onClick={() => {
                      setFilters((p) => ({ ...p, itemno: item.itemNo }))
                      setItemPickerOpen(false)
                    }}
                  >
                    <span>{item.itemNo}</span>
                    <span>{item.itemName}</span>
                  </button>
                ))
              )}
              {filteredItems.length > pickerPageSize && (
                <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                  <span>Page {itemPage} of {totalItemPages}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setItemPage((prev) => Math.max(1, prev - 1))}
                      disabled={itemPage === 1}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setItemPage((prev) => Math.min(totalItemPages, prev + 1))}
                      disabled={itemPage === totalItemPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {batchPickerOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-base font-semibold">Select Batch</h3>
              <Button variant="outline" size="sm" onClick={() => setBatchPickerOpen(false)}>
                Close
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              <div className="px-3 py-2">
                <Input
                  value={batchSearch}
                  onChange={(e) => {
                    setBatchSearch(e.target.value)
                    setBatchPage(1)
                  }}
                  placeholder="Search batch"
                />
              </div>
              <div className="grid grid-cols-[1fr] gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                <div>Pallet</div>
              </div>
              {pagedBatches.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">No batches found.</div>
              ) : (
                pagedBatches.map((pallet) => (
                  <button
                    key={pallet.code}
                    type="button"
                    className="hover:bg-accent grid w-full grid-cols-[1fr] gap-2 rounded-md px-3 py-2 text-left text-sm"
                    onClick={() => {
                      setFilters((p) => ({ ...p, batch: pallet.code }))
                      setBatchPickerOpen(false)
                    }}
                  >
                    <span>{pallet.code}</span>
                  </button>
                ))
              )}
              {filteredBatches.length > pickerPageSize && (
                <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                  <span>Page {batchPage} of {totalBatchPages}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBatchPage((prev) => Math.max(1, prev - 1))}
                      disabled={batchPage === 1}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBatchPage((prev) => Math.min(totalBatchPages, prev + 1))}
                      disabled={batchPage === totalBatchPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {locationPickerOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-base font-semibold">Select Location</h3>
              <Button variant="outline" size="sm" onClick={() => setLocationPickerOpen(false)}>
                Close
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              <div className="px-3 py-2">
                <Input
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value)
                    setLocationPage(1)
                  }}
                  placeholder="Search location code"
                />
              </div>
              <div className="grid grid-cols-[1fr] gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                <div>Location</div>
              </div>
              {pagedLocations.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">No locations found.</div>
              ) : (
                pagedLocations.map((location) => (
                  <button
                    key={location.code}
                    type="button"
                    className="hover:bg-accent grid w-full grid-cols-[1fr] gap-2 rounded-md px-3 py-2 text-left text-sm"
                    onClick={() => {
                      setFilters((p) => ({ ...p, location: location.code }))
                      setLocationPickerOpen(false)
                    }}
                  >
                    <span>{location.code}</span>
                  </button>
                ))
              )}
              {filteredLocations.length > pickerPageSize && (
                <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                  <span>Page {locationPage} of {totalLocationPages}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLocationPage((prev) => Math.max(1, prev - 1))}
                      disabled={locationPage === 1}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLocationPage((prev) => Math.min(totalLocationPages, prev + 1))}
                      disabled={locationPage === totalLocationPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {customerPickerOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-base font-semibold">Select Customer</h3>
              <Button variant="outline" size="sm" onClick={() => setCustomerPickerOpen(false)}>
                Close
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              <div className="px-3 py-2">
                <Input
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setCustomerPage(1)
                  }}
                  placeholder="Search customer no, name, or group"
                />
              </div>
              <div className="grid grid-cols-[160px_1fr_180px] gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                <div>Customer No</div>
                <div>Customer Name</div>
                <div>Customer Group</div>
              </div>
              {pagedCustomers.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">No customers found.</div>
              ) : (
                pagedCustomers.map((customer) => (
                  <button
                    key={customer.customerNo}
                    type="button"
                    className="hover:bg-accent grid w-full grid-cols-[160px_1fr_180px] gap-2 rounded-md px-3 py-2 text-left text-sm"
                    onClick={() => {
                      setFilters((p) => ({ ...p, custno: customer.customerNo }))
                      setCustomerPickerOpen(false)
                    }}
                  >
                    <span>{customer.customerNo}</span>
                    <span>{customer.customerName}</span>
                    <span>{customer.groupName}</span>
                  </button>
                ))
              )}
              {filteredCustomers.length > pickerPageSize && (
                <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                  <span>Page {customerPage} of {totalCustomerPages}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomerPage((prev) => Math.max(1, prev - 1))}
                      disabled={customerPage === 1}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomerPage((prev) => Math.min(totalCustomerPages, prev + 1))}
                      disabled={customerPage === totalCustomerPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Tabs>
  )
}
