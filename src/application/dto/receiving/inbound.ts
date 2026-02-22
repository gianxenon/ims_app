import type { DocumentStatus } from "@/src/shared/transaction-enums"
import type { InboundHeader, InboundLine } from "@/src/domain/receiving/inbound"

// Application-facing shape for inbound documents shown in the UI list.
export type InboundDocumentRecord = {
  documentNo: string
  status: DocumentStatus
  isConfirmed: unknown
  confirmedBy: string
  confirmedDateTime: string
  hasSavedDraft: boolean
  updatedAt: string
  systemReceivingDate: string
  documentReceivingDate: string
  lineCount: number
  header: InboundHeader
  lines: InboundLine[]
  totalQty: number
  totalHeads: number
  totalWeight: number
}
