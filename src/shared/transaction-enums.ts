export const DOCUMENT_STATUS_VALUES = ["D", "O", "C", "CN"] as const
export type DocumentStatus = (typeof DOCUMENT_STATUS_VALUES)[number]

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  D: "Draft",
  O: "Open",
  C: "Close",
  CN: "Cancelled",
}

export const RECEIVING_TYPE_VALUES = ["CS_RECEIVING", "CS_RETURN"] as const
export type ReceivingType = (typeof RECEIVING_TYPE_VALUES)[number]

export const RECEIVING_TYPE_LABELS: Record<ReceivingType, string> = {
  CS_RECEIVING: "CS Receiving",
  CS_RETURN: "CS Return",
}

export const RECEIVING_CATEGORY_VALUES = [
  "IQF",
  "BACKLOAD",
  "REISSUANCE",
  "REPROCESS",
  "UNPROCESS",
] as const
export type ReceivingCategory = (typeof RECEIVING_CATEGORY_VALUES)[number]
