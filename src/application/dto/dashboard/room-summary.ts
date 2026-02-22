// Data transfer object for room summary cards.
export type RoomCard = {
  roomCode: string
  palletTotalQty: number
  totalPalletCount: number
  totalPalletUsedQty: number
  totalWeight: number
  totalHeadPacks: number
}

// Optional filters for room summary queries.
export type RoomSummaryFilters = {
  customerNo?: string
  itemNo?: string
  batch?: string
  location?: string
}
