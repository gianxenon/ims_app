import type { CustomerOption, ItemOption } from "@/src/shared/options"

// Domain types for sales orders.
export type SalesOrderHeader = {
  documentNo: string
  customerNo: string
  customerName: string
  customerGroup: string
  remarks: string
}

export type SalesOrderLine = {
  id: string
  itemNo: string
  itemName: string
  quantity: string
  heads: string
  weight: string
}

export type { CustomerOption, ItemOption }
