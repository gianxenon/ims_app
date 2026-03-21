"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import type { InboundState } from "./use-inbound"

type InboundSummaryProps = Pick<
  InboundState,
  "totalDocuments" | "draftDocumentCount" | "confirmedDocumentCount" | "cancelledDocumentCount"
>
export function InboundSummary({
  totalDocuments,
  draftDocumentCount,
  confirmedDocumentCount,
  cancelledDocumentCount,
}: InboundSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inbound Overview</CardTitle>
        <CardDescription>Inbound documents grid header and quick totals.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Total Documents</p>
            <p className="mt-1 text-2xl font-semibold">{totalDocuments}</p>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Draft</p>
            <p className="mt-1 text-2xl font-semibold">{draftDocumentCount}</p>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Confirmed</p>
            <p className="mt-1 text-2xl font-semibold">{confirmedDocumentCount}</p>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Cancelled</p>
            <p className="mt-1 text-2xl font-semibold">{cancelledDocumentCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
