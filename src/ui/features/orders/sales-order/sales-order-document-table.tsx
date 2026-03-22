"use client"

import type { SalesOrderState } from "./use-sales-order"
import type { SalesOrderDocumentRecord } from "@/src/application/dto/orders/sales-order"
import type { Column } from "@/src/ui/features/document-grid/ui-types"
import { DocumentGridTable } from "@/src/ui/features/document-grid/document-grid-table"
import { DOCUMENT_STATUS_LABELS } from "@/src/shared/transaction-enums"

type SalesOrderDocumentTableProps = Pick<
  SalesOrderState,
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

export function SalesOrderDocumentTable({
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
}: SalesOrderDocumentTableProps) {
  const columns: Column<SalesOrderDocumentRecord>[] = [
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
      key: "status",
      header: "Status",
      className: "min-w-32",
      render: (doc) => `${doc.status} - ${DOCUMENT_STATUS_LABELS[doc.status]}`,
    },
    { key: "lineCount", header: "Lines", className: "text-right", cellClassName: "text-right" },
    { key: "totalQty", header: "Total Qty", className: "text-right", cellClassName: "text-right" },
    { key: "totalHeads", header: "Total Heads", className: "text-right", cellClassName: "text-right" },
    { key: "totalWeight", header: "Total Weight", className: "text-right", cellClassName: "text-right" },
    { key: "updatedAt", header: "Updated At", className: "min-w-56" },
  ]

  return (
    <DocumentGridTable
      title="Sales Orders"
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
      emptyText="No sales orders yet."
      loadingText="Loading sales orders..."
    />
  )
}
