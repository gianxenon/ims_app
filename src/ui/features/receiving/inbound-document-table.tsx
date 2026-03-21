"use client"

import { Plus } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { DOCUMENT_STATUS_LABELS, RECEIVING_TYPE_LABELS } from "@/src/shared/transaction-enums"
import type { InboundState } from "./use-inbound"

type InboundDocumentTableProps = Pick<
  InboundState,
  | "documents"
  | "pagedDocuments"
  | "isLoadingDocuments"
  | "documentPage"
  | "documentPageSize"
  | "totalDocumentPages"
  | "setDocumentPage"
  | "setDocumentPageSize"
  | "onOpenDocument"
  | "onCreateDocument"
> 
export function InboundDocumentTable({
  documents,
  pagedDocuments,
  isLoadingDocuments,
  documentPage,
  documentPageSize,
  totalDocumentPages,
  setDocumentPage,
  setDocumentPageSize,
  onOpenDocument,
  onCreateDocument,
}: InboundDocumentTableProps) {

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Inbound Documents</CardTitle>
            <CardDescription>
              Click any row or document number to open the document details sheet.
            </CardDescription>
          </div>
          <Button type="button" size="sm" onClick={onCreateDocument}>
            <Plus className="size-4" />
            New Document
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-130 overflow-auto rounded-lg border">
          <Table className="min-w-245">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48">Document No</TableHead>
                <TableHead className="min-w-56">Customer</TableHead>
                <TableHead className="min-w-36">Receiving Type</TableHead>
                <TableHead className="min-w-32">Status</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead className="text-right">Total Heads</TableHead>
                <TableHead className="text-right">Total Weight</TableHead>
                <TableHead className="min-w-56">Updated At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingDocuments ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <p className="text-muted-foreground text-sm">Loading inbound documents...</p>
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <p className="text-muted-foreground text-sm">No inbound documents yet.</p>
                  </TableCell>
                </TableRow>
              ) : (
                pagedDocuments.map((document) => (
                  <TableRow
                    key={document.documentNo}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => onOpenDocument(document.documentNo)}
                  >
                    <TableCell>
                      <button
                        type="button"
                        className="text-primary font-medium underline-offset-4 hover:underline"
                        onClick={(event) => {
                          event.stopPropagation()
                          onOpenDocument(document.documentNo)
                        }}
                      >
                        {document.documentNo}
                      </button>
                    </TableCell>
                    <TableCell>{document.header.customerName || document.header.customerNo || "-"}</TableCell>
                    <TableCell>{RECEIVING_TYPE_LABELS[document.header.receivingType]}</TableCell>
                    <TableCell>
                      {document.status} - {DOCUMENT_STATUS_LABELS[document.status]}
                    </TableCell>
                    <TableCell className="text-right">{document.lineCount}</TableCell>
                    <TableCell className="text-right">{document.totalQty}</TableCell>
                    <TableCell className="text-right">{document.totalHeads}</TableCell>
                    <TableCell className="text-right">{document.totalWeight}</TableCell>
                    <TableCell>{document.updatedAt || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!isLoadingDocuments && documents.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-muted-foreground md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="inbound-document-rows">Rows</Label>
              <Select
                value={String(documentPageSize)}
                onValueChange={(value) => {
                  setDocumentPageSize(Number(value))
                  setDocumentPage(1)
                }}
              >
                <SelectTrigger id="inbound-document-rows" className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-center">
              Page {documentPage} of {totalDocumentPages}
            </div>
            <div className="flex items-center justify-start gap-2 md:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDocumentPage((prev) => Math.max(1, prev - 1))}
                disabled={documentPage === 1}
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDocumentPage((prev) => Math.min(totalDocumentPages, prev + 1))}
                disabled={documentPage === totalDocumentPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
