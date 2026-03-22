import type { DocumentStatus } from "@/src/shared/transaction-enums"
import type { InboundHeader, InboundLine, PutAwayStatus } from "@/src/domain/receiving/inbound"

// Initial document header state (used for new documents).
const initialHeader: InboundHeader = {
  documentNo: "",
  customerNo: "",
  customerName: "",
  customerGroup: "",
  palletId: "",
  location: "",
  receivingType: "CS_RECEIVING",
  remarks: "",
}

// Factory for a blank line item draft.
function createLine(): InboundLine {
  return {
    id: "",
    tagNo: "",
    itemNo: "",
    itemName: "",
    receivingCategory: "",
    heads: "",
    palletId: "",
    location: "",
    prdDate: "",
    expDate: "",
    quantity: "1",
    weight: "",
  }
}

// Normalize status based on put-away confirmation.
function normalizeStatus(status: DocumentStatus, putAwayStatus: PutAwayStatus): DocumentStatus {
  if (putAwayStatus === "NOT_PUTAWAY" && status !== "CN") {
    return "D"
  }
  return status
}

// Human-readable label for put-away state.
function putAwayStatusLabel(status: PutAwayStatus): string {
  if (status === "PUTAWAY") return "Confirmed"
  return "Not Confirmed"
}

// Map backend confirmation flags into UI-facing enum values.
function mapIsConfirmedToPutAwayStatus(isConfirmed: unknown): PutAwayStatus {
  const raw = String(isConfirmed ?? "").trim().toLowerCase()
  if (raw === "1" || raw === "true" || raw === "y" || raw === "yes") {
    return "PUTAWAY"
  }
  return "NOT_PUTAWAY"
}

// Only Draft documents that are not confirmed can be edited.
function canEdit(status: DocumentStatus): boolean {
  return status === "D"
}

// Sum numeric fields across line items (guards against non-numeric inputs).
function sumBy(lines: InboundLine[], key: "quantity" | "heads" | "weight"): number {
  return lines.reduce((sum, line) => {
    const parsed = Number(line[key])
    if (Number.isNaN(parsed)) return sum
    return sum + parsed
  }, 0)
}

export {
  initialHeader,
  createLine,
  normalizeStatus,
  putAwayStatusLabel,
  mapIsConfirmedToPutAwayStatus,
  canEdit,
  sumBy,
}
