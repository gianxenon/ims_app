"use client"

import * as React from "react" 

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input" 
import type { CustomerOption, ItemOption, LocationOption } from "@/src/shared/options"
import type { RoomSummaryFilters } from "@/src/application/dto/dashboard/room-summary"
import { loadCustomers, loadItems, loadLocations } from "@/src/application/use-cases/shared/options"
import { useRoomSummary } from "@/src/ui/features/dashboard/room-summary/use-room-summary"
import { RoomSectionCards, RoomSectionCardsSkeleton } from "./room-section-cards"

// UI wrapper that fetches data and renders the room cards.
export function RoomSectionCardsContainer({ company, branch }: { company: string; branch: string }) {
  const hasBranchContext = company.trim().length > 0 && branch.trim().length > 0
  const pickerPageSize = 10
  const [customerOptions, setCustomerOptions] = React.useState<CustomerOption[]>([])
  const [itemOptions, setItemOptions] = React.useState<ItemOption[]>([])
  const [locationOptions, setLocationOptions] = React.useState<LocationOption[]>([])
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [itemSearch, setItemSearch] = React.useState("")
  const [locationSearch, setLocationSearch] = React.useState("")
  const [customerPage, setCustomerPage] = React.useState(1)
  const [itemPage, setItemPage] = React.useState(1)
  const [locationPage, setLocationPage] = React.useState(1)
  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false)
  const [itemPickerOpen, setItemPickerOpen] = React.useState(false)
  const [locationPickerOpen, setLocationPickerOpen] = React.useState(false)

  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerOption | null>(null)
  const [selectedItem, setSelectedItem] = React.useState<ItemOption | null>(null)
  const [selectedLocation, setSelectedLocation] = React.useState<LocationOption | null>(null)

  const filters = React.useMemo<RoomSummaryFilters>(
    () => ({
      customerNo: selectedCustomer?.customerNo,
      itemNo: selectedItem?.itemNo,
      batch: selectedItem?.itemNo,
      location: selectedLocation?.code,
    }),
    [selectedCustomer, selectedItem, selectedLocation]
  )
  
  const { rooms, lastUpdated, error } = useRoomSummary(company, branch, filters)

  const filteredCustomers = customerOptions.filter((c) => {
    const q = customerSearch.trim().toLowerCase()
    if (!q) return true
    return (
      c.customerNo.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.groupName.toLowerCase().includes(q)
    )
  })
  const filteredItems = itemOptions.filter((i) => {
    const q = itemSearch.trim().toLowerCase()
    if (!q) return true
    return i.itemNo.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q)
  })
  const filteredLocations = locationOptions.filter((l) => {
    const q = locationSearch.trim().toLowerCase()
    if (!q) return true
    return l.code.toLowerCase().includes(q)
  })

  const pagedCustomers = filteredCustomers.slice(
    (customerPage - 1) * pickerPageSize,
    customerPage * pickerPageSize
  )
  const pagedItems = filteredItems.slice(
    (itemPage - 1) * pickerPageSize,
    itemPage * pickerPageSize
  )
  const pagedLocations = filteredLocations.slice(
    (locationPage - 1) * pickerPageSize,
    locationPage * pickerPageSize
  )
  const totalCustomerPages = Math.max(1, Math.ceil(filteredCustomers.length / pickerPageSize))
  const totalItemPages = Math.max(1, Math.ceil(filteredItems.length / pickerPageSize))
  const totalLocationPages = Math.max(1, Math.ceil(filteredLocations.length / pickerPageSize))

  React.useEffect(() => {
    if (!hasBranchContext) return

    let mounted = true

    const loadOptions = async () => {
      const [customers, items, locations] = await Promise.all([
        loadCustomers(company, branch),
        loadItems(company, branch),
        loadLocations(company, branch),
      ])
      if (!mounted) return
      if (customers.length > 0) setCustomerOptions(customers)
      if (items.length > 0) setItemOptions(items)
      if (locations.length > 0) setLocationOptions(locations)
    }

    void loadOptions()
    return () => {
      mounted = false
    }
  }, [company, branch, hasBranchContext])

  if (!hasBranchContext) {
    return (
      <div>
        <RoomSectionCardsSkeleton />
      </div>
    )
  }

  return (
    <div>
      {rooms === null ? <RoomSectionCardsSkeleton /> : <RoomSectionCards rooms={rooms} />}

      <div className="text-muted-foreground px-4 pt-1 text-xs lg:px-6">
        Last updated: {lastUpdated || "-"} (auto-refresh every 10s)
      </div>
      {error && <div className="text-destructive px-4 pt-1 text-xs lg:px-6">{error}</div>}

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
                          setSelectedCustomer(customer)
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

      {itemPickerOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-base font-semibold">Select Batch / Item</h3>
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
                      setSelectedItem(item)
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
                      setSelectedLocation(location)
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
    </div>
  )
}
