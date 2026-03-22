"use client"

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_VALUES,
  RECEIVING_TYPE_LABELS,
  RECEIVING_TYPE_VALUES,
} from "@/src/shared/transaction-enums"
import { DocumentSheet } from "@/src/ui/features/document-grid/document-sheet"
import { LookupModal } from "@/src/ui/features/document-grid/lookup-modal"
import type { Column } from "@/src/ui/features/document-grid/ui-types"
import type { CustomerOption, LocationOption, PalletAddressOption } from "@/src/domain/receiving/inbound"
import type { InboundState } from "./use-inbound"
import { putAwayStatusLabel } from "./inbound-helpers"

type InboundEditorSheetProps = Pick<
  InboundState,
  | "documentSheetOpen"
  | "onDocumentSheetOpenChange"
  | "selectedDocumentNo"
  | "header"
  | "headerErrors"
  | "fieldErrorClass"
  | "effectiveStatus"
  | "onDocStatusChange"
  | "putAwayStatus"
  | "putAwayDetails"
  | "onOpenCustomerPicker"
  | "editable"
  | "onHeaderChange"
  | "onOpenPalletPicker"
  | "onOpenLocationPicker"
  | "lines"
  | "lineErrors"
  | "onOpenAddLine"
  | "onEditLine"
  | "onRemoveLine"
  | "totalQty"
  | "totalHeads"
  | "totalWeight"
  | "onConfirm"
  | "onCancel"
  | "onSaveDraft"
  | "onRemoveDraft"
  | "documentStatus"
  | "isSavingDraft"
  | "hasSavedDraft"
  | "customerPickerOpen"
  | "setCustomerPickerOpen"
  | "customerSearch"
  | "setCustomerSearch"
  | "customerPage"
  | "setCustomerPage"
  | "pagedCustomers"
  | "totalCustomerPages"
  | "onSelectCustomer"
  | "locationPickerOpen"
  | "setLocationPickerOpen"
  | "locationSearch"
  | "setLocationSearch"
  | "locationPage"
  | "setLocationPage"
  | "pagedLocations"
  | "totalLocationPages"
  | "onSelectLocation"
  | "palletPickerOpen"
  | "setPalletPickerOpen"
  | "palletSearch"
  | "setPalletSearch"
  | "palletPage"
  | "setPalletPage"
  | "pagedPallets"
  | "totalPalletPages"
  | "onSelectPallet"
>



export function InboundEditorSheet({
  documentSheetOpen,
  onDocumentSheetOpenChange,
  selectedDocumentNo,
  header,
  headerErrors,
  fieldErrorClass,
  effectiveStatus,
  onDocStatusChange,
  putAwayStatus,
  putAwayDetails,
  onOpenCustomerPicker,
  editable,
  onHeaderChange,
  onOpenPalletPicker,
  onOpenLocationPicker,
  lines,
  lineErrors,
  onOpenAddLine,
  onEditLine,
  onRemoveLine,
  totalQty,
  totalHeads,
  totalWeight,
  onConfirm,
  onCancel,
  onSaveDraft,
  onRemoveDraft,
  documentStatus,
  isSavingDraft,
  hasSavedDraft,
  customerPickerOpen,
  setCustomerPickerOpen,
  customerSearch,
  setCustomerSearch,
  customerPage,
  setCustomerPage,
  pagedCustomers,
  totalCustomerPages,
  onSelectCustomer,
  locationPickerOpen,
  setLocationPickerOpen,
  locationSearch,
  setLocationSearch,
  locationPage,
  setLocationPage,
  pagedLocations,
  totalLocationPages,
  onSelectLocation,
  palletPickerOpen,
  setPalletPickerOpen,
  palletSearch,
  setPalletSearch,
  palletPage,
  setPalletPage,
  pagedPallets,
  totalPalletPages,
  onSelectPallet,
}: InboundEditorSheetProps) {
  const customerColumns: Column<CustomerOption>[] = [
    { key: "customerNo", header: "Customer No" },
    { key: "customerName", header: "Customer Name" },
    { key: "groupName", header: "Customer Group" },
  ]
  const locationColumns: Column<LocationOption>[] = [{ key: "code", header: "Location" }]
  const palletColumns: Column<PalletAddressOption>[] = [{ key: "code", header: "Pallet" }]
  const isDraftStatus = documentStatus === "D"
  const isNewDraft = isDraftStatus && !hasSavedDraft
  const isLockedStatus = documentStatus !== "D"
  const backendActionsReady = false

  return (
    <DocumentSheet
      open={documentSheetOpen}
      onOpenChange={onDocumentSheetOpenChange}
      title={selectedDocumentNo ?? "Inbound Document Details"}
      description="Manage inbound header and line details in this sheet."
    >
      <div className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
                  <Label htmlFor="documentNo">Document No</Label>
                  <Input
                    id="documentNo"
                    value={header.documentNo}
                    placeholder="INB-YYYY-000001"
                    readOnly
                    disabled
                  />
                </div>
                <div className="space-y-1 md:justify-self-end md:w-full md:max-w-105">
                  <Label htmlFor="doc-status">Doc Status</Label>
                  <Select value={effectiveStatus} onValueChange={onDocStatusChange} disabled={!editable}>
                    <SelectTrigger id="doc-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_STATUS_VALUES.map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                          disabled={putAwayStatus === "NOT_PUTAWAY" && (status === "O" || status === "C")}
                        >
                          {status} - {DOCUMENT_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
                  <Label htmlFor="customerNo">Customer No</Label>
                  <div className="flex gap-2">
                    <Input
                      id="customerNo"
                      className={headerErrors.customerNo ? fieldErrorClass : undefined}
                      value={header.customerNo}
                      placeholder="Select customer"
                      readOnly
                      onClick={onOpenCustomerPicker}
                      disabled={!editable}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Select customer"
                      title="Select customer"
                      onClick={onOpenCustomerPicker}
                      disabled={!editable}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 md:justify-self-end md:w-full md:max-w-105">
                  <Label>Put Away Status</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {putAwayStatusLabel(putAwayStatus)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-65">
                      <DropdownMenuLabel>Put Away Details</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-sm">
                        <p className="text-muted-foreground">Confirmed By</p>
                        <p className="font-medium">{putAwayDetails.confirmedBy}</p>
                      </div>
                      <div className="px-2 py-1.5 text-sm">
                        <p className="text-muted-foreground">Confirmed Date</p>
                        <p className="font-medium">{putAwayDetails.confirmedDate}</p>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    className={headerErrors.customerName ? fieldErrorClass : undefined}
                    value={header.customerName}
                    placeholder="Customer name"
                    readOnly
                    disabled={!editable}
                  />
                </div>
                <div className="space-y-1 md:justify-self-end md:w-full md:max-w-105">
                  <Label htmlFor="receivingType">Receiving Type</Label>
                  <Select
                    value={header.receivingType}
                    onValueChange={(value) =>
                      onHeaderChange("receivingType", value as typeof header.receivingType)
                    }
                    disabled={!editable}
                  >
                    <SelectTrigger id="receivingType" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECEIVING_TYPE_VALUES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {RECEIVING_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
                  <Label htmlFor="customerGroup">Customer Group</Label>
                  <Input id="customerGroup" value={header.customerGroup} placeholder="Customer group" readOnly disabled={!editable} />
                </div>
                <div className="space-y-1 md:justify-self-end md:w-full md:max-w-105">
                  <Label htmlFor="palletId">Pallet ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="palletId"
                      className={headerErrors.palletId ? fieldErrorClass : undefined}
                      value={header.palletId}
                      placeholder="Select pallet"
                      readOnly
                      onClick={onOpenPalletPicker}
                      disabled={!editable}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Select pallet"
                      title="Select pallet"
                      onClick={onOpenPalletPicker}
                      disabled={!editable}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
                  <Label htmlFor="location">Location</Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      className={headerErrors.location ? fieldErrorClass : undefined}
                      value={header.location}
                      placeholder="Select location"
                      readOnly
                      onClick={onOpenLocationPicker}
                      disabled={!editable}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Select location"
                      title="Select location"
                      onClick={onOpenLocationPicker}
                      disabled={!editable}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2 md:justify-self-start md:w-full md:max-w-105">
                  <Label htmlFor="remarks">Remarks</Label>
                  <textarea
                    id="remarks"
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring/50 min-h-24 max-h-40 w-full max-w-105 resize-none overflow-y-auto rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                    value={header.remarks}
                    onChange={(e) => onHeaderChange("remarks", e.target.value)}
                    placeholder="Optional remarks"
                    disabled={!editable}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Line Items</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={onOpenAddLine} disabled={!editable}>
                    <Plus className="size-4" />
                    Add Line
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-105 overflow-auto rounded-lg border">
                <Table className="min-w-295">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">#</TableHead>
                      <TableHead className="min-w-44">Tag No</TableHead>
                      <TableHead className="min-w-40">Item No</TableHead>
                      <TableHead className="min-w-72">Item Name</TableHead>
                      <TableHead className="min-w-48">Receiving Category</TableHead>
                      <TableHead>PRD</TableHead>
                      <TableHead>EXP</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Heads/Packs</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="w-28" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center">
                          <p className="text-muted-foreground text-sm">No line items yet.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      lines.map((line, index) => (
                        <TableRow
                          key={line.id}
                          className={editable ? "cursor-pointer hover:bg-muted/30" : undefined}
                          onClick={() => {
                            if (!editable) return
                            onEditLine(line.id)
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div
                              className={`bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-sm whitespace-normal break-all ${
                                lineErrors[line.id]?.tagNo ? "border-red-500" : "border-input"
                              }`}
                              title={line.tagNo}
                            >
                              {line.tagNo || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-sm whitespace-normal break-all"
                              title={line.itemNo}
                            >
                              {line.itemNo || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-sm whitespace-normal wrap-break-word"
                              title={line.itemName}
                            >
                              {line.itemName || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-sm whitespace-normal wrap-break-word"
                              title={line.receivingCategory}
                            >
                              {line.receivingCategory || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-sm whitespace-nowrap"
                              title={line.prdDate}
                            >
                              {line.prdDate || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-sm whitespace-nowrap"
                              title={line.expDate}
                            >
                              {line.expDate || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-right text-sm whitespace-nowrap"
                              title={line.quantity}
                            >
                              {line.quantity || "0"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-right text-sm whitespace-nowrap"
                              title={line.heads}
                            >
                              {line.heads || "0"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-right text-sm whitespace-nowrap"
                              title={line.weight}
                            >
                              {line.weight || "0"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onEditLine(line.id)
                                }}
                                disabled={!editable}
                                aria-label="Edit line"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onRemoveLine(line.id)
                                }}
                                disabled={!editable}
                                aria-label="Remove line"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <div className="rounded-md border bg-muted/20 p-3 text-sm">
                  <p>
                    <span className="font-medium">Total Qty:</span> {totalQty}
                  </p>
                  <p>
                    <span className="font-medium">Total Heads/Packs:</span> {totalHeads}
                  </p>
                  <p>
                    <span className="font-medium">Total Weight:</span> {totalWeight}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="size-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Document Action</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isNewDraft ? null : (
                      <>
                        <DropdownMenuItem
                          onClick={onConfirm}
                          disabled={isLockedStatus || !backendActionsReady}
                        >
                          Confirm
                        </DropdownMenuItem>
                        {isDraftStatus ? null : (
                          <DropdownMenuItem
                            onClick={onCancel}
                            disabled={isLockedStatus || !backendActionsReady}
                            variant="destructive"
                          >
                            Cancel
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={onSaveDraft}
                      disabled={isLockedStatus || isSavingDraft}
                    >
                      {isSavingDraft ? "Validating..." : hasSavedDraft ? "Update Draft" : "Add Draft"}
                    </DropdownMenuItem>
                    {isNewDraft ? null : (
                      <DropdownMenuItem
                        onClick={onRemoveDraft}
                        disabled={!isDraftStatus || !backendActionsReady}
                      >
                        Remove Draft
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
      </div>
      <LookupModal
        open={customerPickerOpen}
        title="Select Customer"
        rows={pagedCustomers}
        columns={customerColumns}
        rowKey={(row) => row.customerNo}
        onSelect={(row) => onSelectCustomer(row.customerNo, row.customerName, row.groupName)}
        onClose={() => setCustomerPickerOpen(false)}
        searchPlaceholder="Search customer no, name, or group"
        searchValue={customerSearch}
        onSearchChange={(value) => {
          setCustomerSearch(value)
          setCustomerPage(1)
        }}
        page={customerPage}
        totalPages={totalCustomerPages}
        onPageChange={setCustomerPage}
        emptyText="No customers found."
      />
      <LookupModal
        open={locationPickerOpen}
        title="Select Location"
        rows={pagedLocations}
        columns={locationColumns}
        rowKey={(row) => row.code}
        onSelect={(row) => onSelectLocation(row.code)}
        onClose={() => setLocationPickerOpen(false)}
        searchPlaceholder="Search location code"
        searchValue={locationSearch}
        onSearchChange={(value) => {
          setLocationSearch(value)
          setLocationPage(1)
        }}
        page={locationPage}
        totalPages={totalLocationPages}
        onPageChange={setLocationPage}
        emptyText="No locations found."
      />
      <LookupModal
        open={palletPickerOpen}
        title="Select Pallet"
        rows={pagedPallets}
        columns={palletColumns}
        rowKey={(row) => row.code}
        onSelect={(row) => onSelectPallet(row.code)}
        onClose={() => setPalletPickerOpen(false)}
        searchPlaceholder="Search pallet code"
        searchValue={palletSearch}
        onSearchChange={(value) => {
          setPalletSearch(value)
          setPalletPage(1)
        }}
        page={palletPage}
        totalPages={totalPalletPages}
        onPageChange={setPalletPage}
        emptyText="No pallet addresses found."
      />
    </DocumentSheet>
  )
}
