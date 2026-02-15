import { cookies, headers } from "next/headers"
import { SiteHeader } from "@/src/components/site-header"
import { SendSampleEmailButton } from "@/src/components/send-sample-email-button"

type RoomRow = {
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)
}

function utilization(used: number, total: number): number {
  if (total <= 0) return 0
  return (used / total) * 100
}

function utilizationColor(rate: number): string {
  if (rate < 50) return "text-emerald-700"
  if (rate < 75) return "text-amber-700"
  return "text-rose-700"
}

async function getRooms(company: string, branch: string): Promise<RoomRow[]> {
  const headerStore = await headers()
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host")
  const proto = headerStore.get("x-forwarded-proto") ?? "http"
  if (!host) return []

  const res = await fetch(
    `${proto}://${host}/api/rooms?company=${encodeURIComponent(company)}&branch=${encodeURIComponent(branch)}`,
    { cache: "no-store" }
  )
  if (!res.ok) return []

  const payload = (await res.json()) as { rooms?: Array<Record<string, unknown>> }
  const rows = payload.rooms ?? []

  return rows.map((r) => ({
    roomCode: String(r.roomCode ?? ""),
    palletTotalQty: toNumber(r.palletTotalQty),
    totalPalletCount: toNumber(r.totalPalletCount),
    totalPalletUsedQty: toNumber(r.totalPalletUsedQty),
    totalWeight: toNumber(r.totalWeight),
    totalHeadPacks: toNumber(r.totalHeadPacks),
  }))
}

export default async function PalletUtilizationEmailPreviewPage() {
  const cookieStore = await cookies()
  const company = cookieStore.get("active_company")?.value ?? process.env.PHP_COMPANY ?? "ics"
  const branch = cookieStore.get("active_branch")?.value ?? process.env.PHP_BRANCH ?? "npulcs"
  const rooms = await getRooms(company, branch)

  const totalPallets = rooms.reduce((sum, row) => sum + row.totalPalletCount, 0)
  const usedPallets = rooms.reduce((sum, row) => sum + row.totalPalletUsedQty, 0)
  const totalWeight = rooms.reduce((sum, row) => sum + row.totalWeight, 0)
  const totalHeadsPacks = rooms.reduce((sum, row) => sum + row.totalHeadPacks, 0)
  const totalBarcodeQty = rooms.reduce((sum, row) => sum + row.palletTotalQty, 0)
  const overallRate = utilization(usedPallets, totalPallets)
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(new Date())

  return (
    <>
      <SiteHeader />
      <div className="px-4 py-4 lg:px-6">
        <div className="mx-auto w-full max-w-5xl rounded-xl border bg-white p-6 text-black shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">Daily Pallet Utilization</h1>
            <SendSampleEmailButton company={company} branch={branch} />
          </div>
          <p className="mt-1 text-sm text-gray-600">
            ICS Inventory Dashboard | {company.toUpperCase()} / {branch.toUpperCase()}
          </p>
          <p className="mt-1 text-sm text-gray-600">As of {dateLabel}</p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
            <div className="rounded-md border p-3">
              <div className="text-gray-500">Total Pallets</div>
              <div className="font-semibold">{formatNumber(totalPallets)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-gray-500">Used Pallets</div>
              <div className="font-semibold">{formatNumber(usedPallets)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-gray-500">Total Weight</div>
              <div className="font-semibold">{formatNumber(totalWeight)} kg</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-gray-500">Total Heads/Packs</div>
              <div className="font-semibold">{formatNumber(totalHeadsPacks)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-gray-500">Total Barcode Qty</div>
              <div className="font-semibold">{formatNumber(totalBarcodeQty)}</div>
            </div>
          </div>

          <div className="mt-4 rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Overall Utilization</span>
              <span className={`font-semibold ${utilizationColor(overallRate)}`}>
                {formatNumber(overallRate)}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-sky-600"
                style={{ width: `${Math.min(overallRate, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-md border">
            <table className="w-full min-w-180 border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="border-b px-3 py-2">Room</th>
                  <th className="border-b px-3 py-2 text-right">Total Pallets</th>
                  <th className="border-b px-3 py-2 text-right">Used Pallets</th>
                  <th className="border-b px-3 py-2 text-right">Weight (kg)</th>
                  <th className="border-b px-3 py-2 text-right">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-center text-gray-500" colSpan={5}>
                      No room data available.
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => {
                    const rate = utilization(room.totalPalletUsedQty, room.totalPalletCount)
                    return (
                      <tr key={room.roomCode}>
                        <td className="border-t px-3 py-2">{room.roomCode}</td>
                        <td className="border-t px-3 py-2 text-right">{formatNumber(room.totalPalletCount)}</td>
                        <td className="border-t px-3 py-2 text-right">{formatNumber(room.totalPalletUsedQty)}</td>
                        <td className="border-t px-3 py-2 text-right">{formatNumber(room.totalWeight)}</td>
                        <td className={`border-t px-3 py-2 text-right font-semibold ${utilizationColor(rate)}`}>
                          {formatNumber(rate)}%
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
