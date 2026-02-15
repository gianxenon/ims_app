"use client"

import * as React from "react"
import { toast } from "sonner"
import { RoomSectionCards, RoomSectionCardsSkeleton } from "@/src/components/room-section-cards"

export type RoomCard = {
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

function normalizeRooms(rows: Array<Record<string, unknown>>): RoomCard[] {
  return rows.map((row) => ({
    roomCode: String(row.roomCode ?? ""),
    palletTotalQty: toNumber(row.palletTotalQty),
    totalPalletCount: toNumber(row.totalPalletCount),
    totalPalletUsedQty: toNumber(row.totalPalletUsedQty),
    totalWeight: toNumber(row.totalWeight),
    totalHeadPacks: toNumber(row.totalHeadPacks),
  }))
}

export function RoomSectionCardsContainer({
  company,
  branch,
}: {
  company: string
  branch: string
}) {
  const [rooms, setRooms] = React.useState<RoomCard[] | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<string>("")
  const hadFetchErrorRef = React.useRef(false)

  const fetchRooms = React.useCallback(async () => {
    try {
      const res = await fetch(
        `/api/rooms?company=${encodeURIComponent(company)}&branch=${encodeURIComponent(branch)}`,
        { cache: "no-store" }
      )
      if (!res.ok) {
        setRooms((prev) => prev ?? [])
        if (!hadFetchErrorRef.current) {
          hadFetchErrorRef.current = true
          toast.error("Room summary fetch failed. Retrying...")
        }
        return
      }

      const payload = (await res.json()) as { rooms?: Array<Record<string, unknown>> }
      const nextRooms = normalizeRooms(payload.rooms ?? [])
      setRooms(nextRooms)
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour12: true }))
      if (hadFetchErrorRef.current) {
        hadFetchErrorRef.current = false
        toast.success("Room summary connection restored.")
      }
    } catch {
      setRooms((prev) => prev ?? [])
      if (!hadFetchErrorRef.current) {
        hadFetchErrorRef.current = true
        toast.error("Room summary fetch failed. Retrying...")
      }
    }
  }, [company, branch])

  React.useEffect(() => {
    let mounted = true

    const run = async () => {
      if (!mounted) return
      await fetchRooms()
    }

    void run()

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void run()
      }
    }, 10000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [fetchRooms])

  if (rooms === null) {
    return <RoomSectionCardsSkeleton />
  }

  return (
    <div>
      <RoomSectionCards rooms={rooms} />
      <div className="text-muted-foreground px-4 pt-1 text-xs lg:px-6">
        Last updated: {lastUpdated || "-"} (auto-refresh every 10s)
      </div>
    </div>
  )
}
