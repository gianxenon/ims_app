import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card"

type RoomCard = {
  roomCode: string
  palletTotalQty: number
  totalPalletUsedQty: number
  totalWeight: number
  totalHeadPacks: number
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}

function formatWeight(value: number): string {
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)} kg`
}

export function RoomSectionCards({ rooms }: { rooms: RoomCard[] }) {
  return (
    <section className="px-4 lg:px-6">
      <div className="mb-2">
        <h2 className="text-sm font-semibold">Rooms</h2>
        <p className="text-muted-foreground text-xs">Live room totals and weight</p>
      </div>

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
        <div className="max-h-90 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            {rooms.map((room) => (
              <Card key={room.roomCode} className="gap-3 py-3">
                <CardHeader className="gap-1 px-3">
                  <CardTitle className="text-sm">{room.roomCode}</CardTitle>
                  <CardDescription className="text-xs">Room Summary</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-1.5 px-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pallet Total Qty</span>
                    <span className="font-medium tabular-nums">{formatNumber(room.palletTotalQty)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Pallet Used Qty</span>
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
              </Card>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
