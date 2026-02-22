import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card"
import { Skeleton } from "@/src/components/ui/skeleton"
import type { RoomCard } from "@/src/application/dto/dashboard/room-summary"

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}

function formatWeight(value: number): string {
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)} kg`
}

function roomUtilization(used: number, total: number): number {
  if (total <= 0) return 0
  return (used / total) * 100
}

function utilizationBarClass(utilization: number): string {
  if (utilization < 50) return "bg-emerald-500"
  if (utilization < 75) return "bg-amber-400"
  return "bg-rose-500"
}

// UI component for room summary cards and totals.
export function RoomSectionCards({ rooms }: { rooms: RoomCard[] }) {
  const totalPalletCount = rooms.reduce((sum, room) => sum + room.totalPalletCount, 0)
  const totalPalletUsedQty = rooms.reduce((sum, room) => sum + room.totalPalletUsedQty, 0)
  const totalWeight = rooms.reduce((sum, room) => sum + room.totalWeight, 0)
  const totalBarcodeQty = rooms.reduce((sum, room) => sum + room.palletTotalQty, 0)
  const totalHeadPacks = rooms.reduce((sum, room) => sum + room.totalHeadPacks, 0)
  const utilization = totalPalletCount > 0 ? (totalPalletUsedQty / totalPalletCount) * 100 : 0

  return (
    <section className="px-4 lg:px-6">
      <div className="mb-2">
        <h2 className="text-sm font-semibold">Rooms</h2>
        <p className="text-muted-foreground text-xs">Live room totals and weight</p>
      </div>

      {rooms.length > 0 && (
        <Card className="mb-3 py-3">
          <CardContent className="px-4">
            <div className="mb-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Total Pallets</div>
                <div className="font-medium tabular-nums">{formatNumber(totalPalletCount)}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Used Pallets</div>
                <div className="font-medium tabular-nums">{formatNumber(totalPalletUsedQty)}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Total Heads/Packs</div>
                <div className="font-medium tabular-nums">{formatNumber(totalHeadPacks)}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Total Weight</div>
                <div className="font-medium tabular-nums">{formatWeight(totalWeight)}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-muted-foreground">Total Barcode Qty</div>
                <div className="font-medium tabular-nums">{formatNumber(totalBarcodeQty)}</div>
              </div>
            </div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pallet Utilization</span>
              <span className="font-medium tabular-nums">
                {utilization.toFixed(2)}% ({formatNumber(totalPalletUsedQty)} / {formatNumber(totalPalletCount)})
              </span>
            </div>
            <div className="bg-muted h-2 w-full rounded-full">
              <div
                className={`${utilizationBarClass(utilization)} h-2 rounded-full`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {rooms.length === 0 ? (
        <Card className="py-4">
          <CardHeader className="gap-1 px-4">
            <CardTitle className="text-sm">No room data</CardTitle>
            <CardDescription className="text-xs">
              No room records are available right now.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="max-h-136 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            {rooms.map((room) => (
              <Card key={room.roomCode} className="gap-3 py-3">
                {/** per-room utilization = used pallet slots / total pallet slots */}
                {(() => {
                  const utilization = roomUtilization(room.totalPalletUsedQty, room.totalPalletCount)
                  return (
                    <>
                      <CardHeader className="gap-1 px-3">
                        <CardTitle className="text-sm">{room.roomCode}</CardTitle>
                        <CardDescription className="text-xs">
                          Utilization {utilization.toFixed(2)}%
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 gap-1.5 px-3 text-xs">
                        <div className="bg-muted mb-1 h-1.5 w-full rounded-full">
                          <div
                            className={`${utilizationBarClass(utilization)} h-1.5 rounded-full`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Barcode Total Qty</span>
                          <span className="font-medium tabular-nums">{formatNumber(room.palletTotalQty)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total Pallet Count</span>
                          <span className="font-medium tabular-nums">{formatNumber(room.totalPalletCount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Pallet Used (Stock)</span>
                          <span className="font-medium tabular-nums">{formatNumber(room.totalPalletUsedQty)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total Weight</span>
                          <span className="font-medium tabular-nums">{formatWeight(room.totalWeight)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total Head/Packs</span>
                          <span className="font-medium tabular-nums">{formatNumber(room.totalHeadPacks)}</span>
                        </div>
                      </CardContent>
                    </>
                  )
                })()}
              </Card>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export function RoomSectionCardsSkeleton() {
  return (
    <section className="px-4 lg:px-6">
      <div className="mb-2">
        <h2 className="text-sm font-semibold">Rooms</h2>
        <p className="text-muted-foreground text-xs">Live room totals and weight</p>
      </div>

      <Card className="mb-3 py-3">
        <CardContent className="px-4">
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
          </div>
          <Skeleton className="mb-2 h-3 w-40" />
          <Skeleton className="h-2 w-full rounded-full" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </section>
  )
}
