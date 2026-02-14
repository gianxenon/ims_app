import { headers } from "next/headers"
import { DataTable } from "@/src/components/data-table"
import { RoomSectionCards } from "@/src/components/room-section-cards"
import { SiteHeader } from "@/src/components/site-header"

import data from "./data.json"

type RoomCard = {
  roomCode: string
  palletTotalQty: number
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
    totalPalletUsedQty: toNumber(row.totalPalletUsedQty),
    totalWeight: toNumber(row.totalWeight),
    totalHeadPacks: toNumber(row.totalHeadPacks),
  }))
}

export default async function DashboardPage() {
  const rooms = await getRooms()

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <RoomSectionCards rooms={rooms} />
            <section className="px-4 lg:px-6">
              <DataTable data={data} />
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
