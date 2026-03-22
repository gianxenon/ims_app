"use client"

import { SiteHeader } from "@/src/components/site-header"
import { SalesOrderDocumentTable } from "@/src/ui/features/orders/sales-order/sales-order-document-table"
import { SalesOrderEditorSheet } from "@/src/ui/features/orders/sales-order/sales-order-editor-sheet"
import { SalesOrderLineEditorSheet } from "@/src/ui/features/orders/sales-order/sales-order-line-editor-sheet"
import { SalesOrderSummary } from "@/src/ui/features/orders/sales-order/sales-order-summary"
import { useSalesOrder } from "@/src/ui/features/orders/sales-order/use-sales-order"

export default function SalesOrderPage() {
  const salesOrder = useSalesOrder()
  return (
  <>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
              <SalesOrderSummary {...salesOrder} />
              <SalesOrderDocumentTable {...salesOrder} />
              <SalesOrderEditorSheet {...salesOrder} />
              <SalesOrderLineEditorSheet {...salesOrder} />
            </div>
          </div>
        </div>
      </>
  )
}
