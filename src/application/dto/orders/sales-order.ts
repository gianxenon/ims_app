import type { DocumentStatus } from "@/src/shared/transaction-enums"
import type { SalesOrderHeader, SalesOrderLine } from "@/src/domain/orders/sales-order"

// Application-facing shape for sales order documents shown in the UI list.
export type SalesOrderDocumentRecord = {
  documentNo: string
  status: DocumentStatus
  updatedAt: string
  lineCount: number
  header: SalesOrderHeader
  lines: SalesOrderLine[]
  totalQty: number
  totalHeads: number
  totalWeight: number
}
