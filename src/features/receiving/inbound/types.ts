import type { ReceivingCategory, ReceivingType } from "@/src/lib/transaction-enums"

export type PutAwayStatus = "NOT_PUTAWAY" | "PUTAWAY"

export type CustomerOption = {
  customerNo: string
  customerName: string
  customerGroup: string
  groupName: string
}

export type ItemOption = {
  itemNo: string
  itemName: string
}

export type LocationOption = {
  code: string
}

export type PalletAddressOption = {
  code: string
}

export type InboundHeader = {
  documentNo: string
  customerNo: string
  customerName: string
  customerGroup: string
  palletId: string
  location: string
  receivingType: ReceivingType
  remarks: string
}

export type InboundLine = {
  id: string
  tagNo: string
  itemNo: string
  itemName: string
  receivingCategory: ReceivingCategory | ""
  heads: string
  palletId: string
  location: string
  prdDate: string
  expDate: string
  quantity: string
  weight: string
}
