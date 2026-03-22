"use client"

import { MoreHorizontal } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/src/components/ui/sheet"
import { LookupModal } from "@/src/ui/features/document-grid/lookup-modal"
import type { Column } from "@/src/ui/features/document-grid/ui-types"
import type { ItemOption } from "@/src/domain/orders/sales-order"
import type { SalesOrderState } from "./use-sales-order"

type SalesOrderLineEditorSheetProps = Pick<
  SalesOrderState,
  | "lineFormOpen"
  | "onLineFormOpenChange"
  | "itemPickerOpen"
  | "setItemPickerOpen"
  | "lineDraft"
  | "lineDraftErrors"
  | "fieldErrorClass"
  | "editingLineId"
  | "onLineDraftChange"
  | "onSaveLineDraft"
  | "closeLineForm"
  | "itemSearch"
  | "setItemSearch"
  | "itemPage"
  | "setItemPage"
  | "pagedItems"
  | "totalItemPages"
  | "onSelectItem"
>

export function SalesOrderLineEditorSheet({
  lineFormOpen,
  onLineFormOpenChange,
  itemPickerOpen,
  setItemPickerOpen,
  lineDraft,
  lineDraftErrors,
  fieldErrorClass,
  editingLineId,
  onLineDraftChange,
  onSaveLineDraft,
  closeLineForm,
  itemSearch,
  setItemSearch,
  itemPage,
  setItemPage,
  pagedItems,
  totalItemPages,
  onSelectItem,
}: SalesOrderLineEditorSheetProps) {
  const itemColumns: Column<ItemOption>[] = [
    { key: "itemNo", header: "Item No" },
    { key: "itemName", header: "Item Name" },
  ]

  return (
    <Sheet open={lineFormOpen} onOpenChange={onLineFormOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{editingLineId ? "Edit Line Item" : "Add Line Item"}</SheetTitle>
          <SheetDescription>
            {editingLineId
              ? "Update the line details, then save changes."
              : "Fill in the line details, then save to the table."}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label>Item No</Label>
              <div className="flex gap-2">
                <Input
                  className={lineDraftErrors.itemNo ? fieldErrorClass : undefined}
                  value={lineDraft.itemNo}
                  readOnly
                  placeholder="Select item"
                />
                <Button
                  variant="outline"
                  size="icon-sm"
                  type="button"
                  aria-label="Select item"
                  title="Select item"
                  onClick={() => {
                    setItemSearch("")
                    setItemPage(1)
                    setItemPickerOpen(true)
                  }}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Item Name</Label>
              <Input value={lineDraft.itemName} readOnly placeholder="Auto-filled from item selection" />
            </div>

            <div className="space-y-1">
              <Label>Qty</Label>
              <Input
                className={lineDraftErrors.quantity ? fieldErrorClass : undefined}
                type="number"
                value={lineDraft.quantity}
                onChange={(e) => onLineDraftChange("quantity", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Heads/Packs</Label>
              <Input
                className={lineDraftErrors.heads ? fieldErrorClass : undefined}
                type="number"
                value={lineDraft.heads}
                onChange={(e) => onLineDraftChange("heads", e.target.value)}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Weight</Label>
              <Input
                className={lineDraftErrors.weight ? fieldErrorClass : undefined}
                type="number"
                value={lineDraft.weight}
                onChange={(e) => onLineDraftChange("weight", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeLineForm}>
              Cancel
            </Button>
            <Button onClick={onSaveLineDraft}>{editingLineId ? "Save Changes" : "Add Line"}</Button>
          </div>
        </div>

        <LookupModal
          open={itemPickerOpen}
          title="Item List"
          rows={pagedItems}
          columns={itemColumns}
          rowKey={(row) => row.itemNo}
          onSelect={(row) => onSelectItem(row.itemNo, row.itemName)}
          onClose={() => setItemPickerOpen(false)}
          searchPlaceholder="Search item no or item name"
          searchValue={itemSearch}
          onSearchChange={(value) => {
            setItemSearch(value)
            setItemPage(1)
          }}
          page={itemPage}
          totalPages={totalItemPages}
          onPageChange={setItemPage}
          emptyText="No items found."
        />
      </SheetContent>
    </Sheet>
  )
}
