import { DocumentStatus } from "../shared/transaction-enums";
import { InboundState } from "../ui/features/receiving/use-inbound";        
export type  InboundDocumentTableProps = Pick<
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


// Only Draft documents that are not confirmed can be edited.
function canEdit(status: DocumentStatus): boolean {
  return status === "D"
}


export { 
  canEdit, 
}
