"use client"

import { SiteHeader } from "@/src/components/site-header"
import { InboundDocumentTable } from "../../../../ui/features/receiving/inbound-document-table"
import { InboundEditorSheet } from "../../../../ui/features/receiving/inbound-editor-sheet"
import { InboundLineEditorSheet } from "../../../../ui/features/receiving/inbound-line-editor-sheet"
import { InboundPickers } from "../../../../ui/features/receiving/inbound-pickers"
import { InboundSummary } from "../../../../ui/features/receiving/inbound-summary"
import { useInbound } from "../../../../ui/features/receiving/use-inbound"

export default function InboundPage( ) {

 const {totalDocuments, draftDocumentCount, confirmedDocumentCount,  cancelledDocumentCount,
  documents, pagedDocuments, isLoadingDocuments, documentPage,
  documentPageSize, totalDocumentPages, setDocumentPage, setDocumentPageSize, onOpenDocument, onCreateDocument,} =  useInbound() 
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            <InboundSummary {...{ totalDocuments, draftDocumentCount, confirmedDocumentCount, cancelledDocumentCount }} />
            <InboundDocumentTable {...{ documents, pagedDocuments, isLoadingDocuments, documentPage, documentPageSize, totalDocumentPages, setDocumentPage, setDocumentPageSize, onOpenDocument, onCreateDocument }} />
            {/*  
            <InboundDocumentTable {...inbound} />
            <InboundEditorSheet {...inbound} />
            <InboundLineEditorSheet {...inbound} />
            <InboundPickers {...inbound} /> */}
          </div>
        </div>
      </div>
    </>
  )
}
