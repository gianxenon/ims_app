"use client"

import { MoreHorizontal } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/src/components/ui/sheet"
import { RECEIVING_CATEGORY_VALUES } from "@/src/shared/transaction-enums"
import type { InboundState } from "./use-inbound"

export function InboundLineEditorSheet({
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
  filteredItems,
  pagedItems,
  totalItemPages,
  onSelectItem,
}: InboundState) {
  return (
    <Sheet open={lineFormOpen} onOpenChange={onLineFormOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl"
        onInteractOutside={(e) => {
          if (itemPickerOpen) e.preventDefault()
        }}
      >
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
              <Label>Tag No</Label>
              <Input
                className={lineDraftErrors.tagNo ? fieldErrorClass : undefined}
                value={lineDraft.tagNo}
                onChange={(e) => onLineDraftChange("tagNo", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Receiving Category</Label>
              <Select
                value={lineDraft.receivingCategory}
                onValueChange={(value) => onLineDraftChange("receivingCategory", value)}
              >
                <SelectTrigger className={lineDraftErrors.receivingCategory ? fieldErrorClass : undefined}>
                  <SelectValue placeholder="Select receiving category" />
                </SelectTrigger>
                <SelectContent>
                  {RECEIVING_CATEGORY_VALUES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>PRD</Label>
              <Input
                className={lineDraftErrors.prdDate ? fieldErrorClass : undefined}
                type="date"
                value={lineDraft.prdDate}
                onChange={(e) => onLineDraftChange("prdDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>EXP</Label>
              <Input
                className={lineDraftErrors.expDate ? fieldErrorClass : undefined}
                type="date"
                value={lineDraft.expDate}
                onChange={(e) => onLineDraftChange("expDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Qty</Label>
              <Input type="number" value="1" readOnly disabled />
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

        {itemPickerOpen && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-base font-semibold">Item List</h3>
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
                {filteredItems.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No items found.</div>
                ) : (
                  pagedItems.map((item) => (
                    <button
                      key={item.itemNo}
                      type="button"
                      className="hover:bg-accent grid w-full grid-cols-[180px_1fr] gap-2 rounded-md px-3 py-2 text-left text-sm"
                      onClick={() => onSelectItem(item.itemNo, item.itemName)}
                    >
                      <span>{item.itemNo}</span>
                      <span>{item.itemName}</span>
                    </button>
                  ))
                )}
                {filteredItems.length > 0 && (
                  <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                    <span>
                      Page {itemPage} of {totalItemPages}
                    </span>
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
      </SheetContent>
    </Sheet>
  )
}
