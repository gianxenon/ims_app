import { headers } from "next/headers"
import { CurrentStockTable } from "@/src/components/current-stock-table"
import { RoomSectionCards } from "@/src/components/room-section-cards"
import { SiteHeader } from "@/src/components/site-header"

type RoomCard = {
  roomCode: string
  palletTotalQty: number
  totalPalletCount: number
  totalPalletUsedQty: number
  totalWeight: number
  totalHeadPacks: number
}

function toNumber(value: unknown): number {
  return Number(value ?? 0)
}

async function getRooms(): Promise<RoomCard[]> {
  const headerStore = await headers()
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host")
  const proto = headerStore.get("x-forwarded-proto") ?? "http"

  if (!host) return []

  const company = process.env.PHP_COMPANY ?? "ics"
  const branch = process.env.PHP_BRANCH ?? "npulcs"

  const res = await fetch(
    `${proto}://${host}/api/rooms?company=${encodeURIComponent(company)}&branch=${encodeURIComponent(branch)}`,
    { cache: "no-store" }
  )

  if (!res.ok) return []

  const payload = (await res.json()) as { rooms?: Array<Record<string, unknown>> }
  const rows = payload.rooms ?? []

  return rows.map((row) => ({
    roomCode: String(row.roomCode ?? ""),
    palletTotalQty: toNumber(row.palletTotalQty),
    totalPalletCount: toNumber(row.totalPalletCount),
    totalPalletUsedQty: toNumber(row.totalPalletUsedQty),
    totalWeight: toNumber(row.totalWeight),
    totalHeadPacks: toNumber(row.totalHeadPacks),
  }))
}

export default async function DashboardPage() {
  const rooms = await getRooms()
  const company = process.env.PHP_COMPANY ?? "ics"
  const branch = process.env.PHP_BRANCH ?? "npulcs"

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <RoomSectionCards rooms={rooms} />
            <section className="px-4 lg:px-6">
              <CurrentStockTable company={company} branch={branch} />
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
