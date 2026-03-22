"use client"

import { SiteHeader } from "@/src/components/site-header"
import { InboundDocumentTable } from "../../../../ui/features/receiving/inbound-document-table"
import { InboundEditorSheet } from "../../../../ui/features/receiving/inbound-editor-sheet"
import { InboundLineEditorSheet } from "../../../../ui/features/receiving/inbound-line-editor-sheet"
import { InboundSummary } from "../../../../ui/features/receiving/inbound-summary"
import { useInbound } from "../../../../ui/features/receiving/use-inbound"

export default function InboundPage( ) {

 const inbound = useInbound()
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            <InboundSummary  {...inbound}/>
            <InboundDocumentTable {...inbound} />
            <InboundEditorSheet {...inbound} />
            <InboundLineEditorSheet {...inbound} />
          </div>
        </div>
      </div>
    </>
  )
}
