"use client"

// import { Plus } from "lucide-react"

// import { Button } from "@/src/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
// import { Label } from "@/src/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table" 
import { DocumentGridTable } from "@/src/ui/features/document-grid/document-grid-table"
import type { Column } from "@/src/ui/features/document-grid/ui-types"
import type { InboundDocumentRecord } from "@/src/application/dto/receiving/inbound"
import { DOCUMENT_STATUS_LABELS, RECEIVING_TYPE_LABELS } from "@/src/shared/transaction-enums"
import { InboundDocumentTableProps } from "@/src/types/documentTable"


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
const columns: Column<InboundDocumentRecord>[] = [
  {
    key: "documentNo",
    header: "Document No",
    className: "min-w-48",
    render: (doc) => (
      <button
        type="button"
        className="text-primary font-medium underline-offset-4 hover:underline"
        onClick={(event) => {
          event.stopPropagation()
          onOpenDocument(doc.documentNo)
        }}
      >
        {doc.documentNo}
      </button>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    className: "min-w-56",
    render: (doc) => doc.header.customerName || doc.header.customerNo || "-",
  },
  {
    key: "receivingType",
    header: "Receiving Type",
    className: "min-w-36",
    render: (doc) => RECEIVING_TYPE_LABELS[doc.header.receivingType],
  },
  {
    key: "status",
    header: "Status",
    className: "min-w-32",
    render: (doc) => `${doc.status} - ${DOCUMENT_STATUS_LABELS[doc.status]}`,
  },
  { key: "lineCount", header: "Lines", className: "text-right" },
  { key: "totalQty", header: "Total Qty", className: "text-right" },
  { key: "totalHeads", header: "Total Heads", className: "text-right" },
  { key: "totalWeight", header: "Total Weight", className: "text-right" },
  { key: "updatedAt", header: "Updated At", className: "min-w-56" },
]

   return (
  <DocumentGridTable
    title="Inbound Documents"
    description="Click any row or document number to open the document details sheet."
    rows={pagedDocuments}
    totalCount={documents.length}
    isLoading={isLoadingDocuments}
    columns={columns}
    rowKey={(doc) => doc.documentNo}
    onRowClick={(doc) => onOpenDocument(doc.documentNo)}
    page={documentPage}
    pageSize={documentPageSize}
    totalPages={totalDocumentPages}
    onPageChange={setDocumentPage}
    onPageSizeChange={(size) => {
      setDocumentPageSize(size)
      setDocumentPage(1)
    }}
    onCreate={onCreateDocument}
  />
)
}
