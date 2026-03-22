"use client"

import { MoreHorizontal } from "lucide-react"

import { Button } from "@/src/components/ui/button"
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
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_VALUES } from "@/src/shared/transaction-enums"
import { DocumentSheet } from "@/src/ui/features/document-grid/document-sheet"
import { LineItemsTable } from "@/src/ui/features/document-grid/line-item-table"
import { LookupModal } from "@/src/ui/features/document-grid/lookup-modal"
import type { Column, RowAction } from "@/src/ui/features/document-grid/ui-types"
import type { CustomerOption, SalesOrderLine } from "@/src/domain/orders/sales-order"
import type { SalesOrderState } from "./use-sales-order"

type SalesOrderEditorSheetProps = Pick<
  SalesOrderState,
  | "documentSheetOpen"
  | "onDocumentSheetOpenChange"
  | "selectedDocumentNo"
  | "header"
  | "headerErrors"
  | "fieldErrorClass"
  | "documentStatus"
  | "onDocStatusChange"
  | "editable"
  | "onHeaderChange"
  | "onOpenCustomerPicker"
  | "lines"
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
>

export function SalesOrderEditorSheet({
  documentSheetOpen,
  onDocumentSheetOpenChange,
  selectedDocumentNo,
  header,
  headerErrors,
  fieldErrorClass,
  documentStatus,
  onDocStatusChange,
  editable,
  onHeaderChange,
  onOpenCustomerPicker,
  lines,
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
}: SalesOrderEditorSheetProps) {
  const customerColumns: Column<CustomerOption>[] = [
    { key: "customerNo", header: "Customer No" },
    { key: "customerName", header: "Customer Name" },
    { key: "groupName", header: "Customer Group" },
  ]

  const lineColumns: Column<SalesOrderLine>[] = [
    { key: "itemNo", header: "Item No", className: "min-w-40" },
    { key: "itemName", header: "Item Name", className: "min-w-72" },
    { key: "quantity", header: "Qty", className: "text-right", cellClassName: "text-right" },
    { key: "heads", header: "Heads/Packs", className: "text-right", cellClassName: "text-right" },
    { key: "weight", header: "Weight", className: "text-right", cellClassName: "text-right" },
  ]

  const rowActions: RowAction<SalesOrderLine>[] = [
    {
      id: "edit",
      label: "Edit",
      onClick: (line) => onEditLine(line.id),
      disabled: () => !editable,
    },
    {
      id: "delete",
      label: "Delete",
      onClick: (line) => onRemoveLine(line.id),
      disabled: () => !editable,
    },
  ]

  const isDraftStatus = documentStatus === "D"
  const isNewDraft = isDraftStatus && !hasSavedDraft
  const isLockedStatus = documentStatus !== "D"
  const backendActionsReady = false
  const disableSave = isLockedStatus || isSavingDraft

  return (
    <DocumentSheet
      open={documentSheetOpen}
      onOpenChange={onDocumentSheetOpenChange}
      title={selectedDocumentNo ?? "Sales Order Details"}
      description="Manage sales order header and line details in this sheet."
    >
      <div className="mt-4 space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
              <Label htmlFor="documentNo">Document No</Label>
              <Input id="documentNo" value={header.documentNo} placeholder="SO-YYYY-000001" readOnly disabled />
            </div>
            <div className="space-y-1 md:justify-self-end md:w-full md:max-w-105">
              <Label htmlFor="doc-status">Doc Status</Label>
              <Select value={documentStatus} onValueChange={onDocStatusChange} disabled={!editable}>
                <SelectTrigger id="doc-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_STATUS_VALUES.map((status) => (
                    <SelectItem key={status} value={status}>
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
            <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
              <Label htmlFor="customerGroup">Customer Group</Label>
              <Input id="customerGroup" value={header.customerGroup} placeholder="Customer group" readOnly disabled={!editable} />
            </div>
            <div className="space-y-1 md:justify-self-end md:w-full md:max-w-105">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={header.remarks}
                onChange={(event) => onHeaderChange("remarks", event.target.value)}
                placeholder="Optional remarks"
                disabled={!editable}
              />
            </div>
          </div>
        </div>

        <LineItemsTable
          title="Line Items"
          rows={lines}
          columns={lineColumns}
          rowKey={(row) => row.id}
          rowActions={rowActions}
          onRowClick={editable ? (row) => onEditLine(row.id) : undefined}
          onAddLine={editable ? onOpenAddLine : undefined}
          emptyText="No line items yet."
          footer={
            <div className="flex flex-wrap items-end justify-between gap-3">
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
                  <DropdownMenuItem onClick={onSaveDraft} disabled={disableSave}>
                    {isSavingDraft ? "Saving..." : hasSavedDraft ? "Update Draft" : "Add Draft"}
                  </DropdownMenuItem>
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
                      <DropdownMenuItem
                        onClick={onRemoveDraft}
                        disabled={!isDraftStatus || !backendActionsReady}
                      >
                        Remove Draft
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />
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
    </DocumentSheet>
  )
}
