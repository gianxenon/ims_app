"use client"

import { useRoomSummary } from "../room-summary/use-room-summary"
import { RoomSectionCards, RoomSectionCardsSkeleton } from "./room-section-cards"

 
 
export function RoomSectionCardsContainer({ company, branch, }: { company: string ,branch: string }) {
  const { rooms, lastUpdated, error } = useRoomSummary(company, branch) 
  if (rooms === null) { return <RoomSectionCardsSkeleton /> } 
  return (
    <div>
      <RoomSectionCards rooms={rooms} />
      <div className="text-muted-foreground px-4 pt-1 text-xs lg:px-6">
        Last updated: {lastUpdated || "-"} (auto-refresh every 10s)
      </div> 
      {error && <div className="text-destructive px-4 pt-1 text-xs lg:px-6">{error}</div>} 
    </div>
  )
}
 

