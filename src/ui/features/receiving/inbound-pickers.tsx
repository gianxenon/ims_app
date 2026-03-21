"use client"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import type { InboundState } from "./use-inbound"

export function InboundPickers({
  customerPickerOpen,
  setCustomerPickerOpen,
  customerSearch,
  setCustomerSearch,
  customerPage,
  setCustomerPage,
  filteredCustomers,
  pagedCustomers,
  totalCustomerPages,
  onSelectCustomer,
  locationPickerOpen,
  setLocationPickerOpen,
  locationSearch,
  setLocationSearch,
  locationPage,
  setLocationPage,
  filteredLocations,
  pagedLocations,
  totalLocationPages,
  onSelectLocation,
  palletPickerOpen,
  setPalletPickerOpen,
  palletSearch,
  setPalletSearch,
  palletPage,
  setPalletPage,
  filteredPallets,
  pagedPallets,
  totalPalletPages,
  onSelectPallet,
}: InboundState) {
  return (
    <>
      {customerPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background w-full max-w-3xl overflow-hidden rounded-lg border shadow-lg">
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
              {filteredCustomers.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">No customers found.</div>
              ) : (
                pagedCustomers.map((customer) => (
                  <button
                    key={customer.customerNo}
                    type="button"
                    className="hover:bg-accent grid w-full grid-cols-[160px_1fr_180px] gap-2 rounded-md px-3 py-2 text-left text-sm"
                    onClick={() =>
                      onSelectCustomer(customer.customerNo, customer.customerName, customer.groupName)
                    }
                  >
                    <span>{customer.customerNo}</span>
                    <span>{customer.customerName}</span>
                    <span>{customer.groupName}</span>
                  </button>
                ))
              )}
              {filteredCustomers.length > 0 && (
                <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                  <span>
                    Page {customerPage} of {totalCustomerPages}
                  </span>
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

      {locationPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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
              {filteredLocations.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">No locations found.</div>
              ) : (
                pagedLocations.map((location) => (
                  <button
                    key={location.code}
                    type="button"
                    className="hover:bg-accent grid w-full grid-cols-[1fr] gap-2 rounded-md px-3 py-2 text-left text-sm"
                    onClick={() => onSelectLocation(location.code)}
                  >
                    <span>{location.code}</span>
                  </button>
                ))
              )}
              {filteredLocations.length > 0 && (
                <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                  <span>
                    Page {locationPage} of {totalLocationPages}
                  </span>
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

      {palletPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-base font-semibold">Select Pallet</h3>
              <Button variant="outline" size="sm" onClick={() => setPalletPickerOpen(false)}>
                Close
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              <div className="px-3 py-2">
                <Input
                  value={palletSearch}
                  onChange={(e) => {
                    setPalletSearch(e.target.value)
                    setPalletPage(1)
                  }}
                  placeholder="Search pallet code"
                />
              </div>
              <div className="grid grid-cols-[1fr] gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                <div>Pallet</div>
              </div>
              {filteredPallets.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">No pallet addresses found.</div>
              ) : (
                pagedPallets.map((pallet) => (
                  <button
                    key={pallet.code}
                    type="button"
                    className="hover:bg-accent grid w-full grid-cols-[1fr] gap-2 rounded-md px-3 py-2 text-left text-sm"
                    onClick={() => onSelectPallet(pallet.code)}
                  >
                    <span>{pallet.code}</span>
                  </button>
                ))
              )}
              {filteredPallets.length > 0 && (
                <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                  <span>
                    Page {palletPage} of {totalPalletPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPalletPage((prev) => Math.max(1, prev - 1))}
                      disabled={palletPage === 1}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPalletPage((prev) => Math.min(totalPalletPages, prev + 1))}
                      disabled={palletPage === totalPalletPages}
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
    </>
  )
}
