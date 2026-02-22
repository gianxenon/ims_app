import type { DocumentStatus } from "@/src/shared/transaction-enums"
import type {
  CustomerOption,
  InboundHeader,
  InboundLine,
  ItemOption,
  LocationOption,
  PalletAddressOption,
} from "@/src/domain/receiving/inbound"
import type { InboundDocumentRecord } from "@/src/application/dto/receiving/inbound"
import {
  // fetchCustomers,
  // fetchItems,
  // fetchLocations,
  // fetchPalletAddresses,
  fetchReceivingDocumentLines,
  fetchReceivingDocuments,
  // validateLocation as validateLocationRequest,
  // validateReceivingDraft as validateReceivingDraftRequest,
} from "@/src/infrastructure/data-sources/receiving/inbound"

// Normalize backend status values into allowed status codes.
function normalizeDocumentStatus(value: string): DocumentStatus {
  const status = value.trim().toUpperCase()
  if (status === "D" || status === "O" || status === "C" || status === "CN") return status
  if (status === "CANCELLED" || status === "CANCELED") return "CN"
  if (status === "CLOSE" || status === "CLOSED") return "C"
  if (status === "OPEN") return "O"
  return "D"
}

// Normalize receiving type values coming from the backend.
function normalizeReceivingType(value: string): InboundHeader["receivingType"] {
  const type = value.trim().toUpperCase()
  if (type === "CS_RETURN" || type.includes("RETURN")) return "CS_RETURN"
  return "CS_RECEIVING"
}

// Load inbound document headers for the list view.
export async function loadReceivingDocuments(company: string, branch: string) {
  const result = await fetchReceivingDocuments(company, branch)
  if (!result.ok) return { ok: false as const, message: result.message }

  const documents = Array.isArray(result.data.documents) ? result.data.documents : []

  const mapped: InboundDocumentRecord[] = documents
    .filter((doc) => String(doc.documentNo ?? "").trim().length > 0)
    .map((doc) => {
      const totalQtyValue = Number(doc.totalQty ?? 0)
      const totalHeadsValue = Number(doc.totalHeads ?? 0)
      const totalWeightValue = Number(doc.totalWeight ?? 0)
      const receivingType = normalizeReceivingType(String(doc.receivingType ?? ""))
      const status = normalizeDocumentStatus(String(doc.status ?? ""))
      const confirmedBy = String(doc.confirmedBy ?? "").trim()
      const confirmedDateTime = String(doc.confirmedDateTime ?? "").trim()
      const updatedAt =
        String(doc.systemReceivingDate ?? "").trim() ||
        String(doc.documentReceivingDate ?? "").trim() ||
        ""

      return {
        documentNo: String(doc.documentNo ?? "").trim(),
        status,
        isConfirmed: doc.isConfirmed ?? 0,
        confirmedBy,
        confirmedDateTime,
        hasSavedDraft: status === "D",
        updatedAt,
        systemReceivingDate: String(doc.systemReceivingDate ?? "").trim(),
        documentReceivingDate: String(doc.documentReceivingDate ?? "").trim(),
        lineCount: Number.isFinite(totalQtyValue) ? totalQtyValue : 0,
        header: {
          documentNo: String(doc.documentNo ?? "").trim(),
          customerNo: String(doc.customerNo ?? ""),
          customerName: String(doc.customerName ?? ""),
          customerGroup: String(doc.customerGroup ?? ""),
          palletId: String(doc.palletId ?? ""),
          location: String(doc.location ?? ""),
          receivingType,
          remarks: String(doc.remarks ?? ""),
        },
        lines: [],
        totalQty: Number.isFinite(totalQtyValue) ? totalQtyValue : 0,
        totalHeads: Number.isFinite(totalHeadsValue) ? totalHeadsValue : 0,
        totalWeight: Number.isFinite(totalWeightValue) ? totalWeightValue : 0,
      }
    })

  return { ok: true as const, documents: mapped }
}

// Load inbound document lines for a selected document.
export async function loadReceivingDocumentLines(
  company: string,
  branch: string,
  documentNo: string,
  fallbackHeader: InboundHeader
) {
  const result = await fetchReceivingDocumentLines(company, branch, documentNo)
  if (!result.ok) return { ok: false as const, message: result.message }

  const payload = result.data
  const linesPayload = Array.isArray(payload.lines) ? payload.lines : []

  const lines: InboundLine[] = linesPayload.map((line, index) => ({
    id: `${documentNo}-${line.lineNo ?? index + 1}-${line.tagNo ?? line.itemNo ?? index + 1}`,
    tagNo: String(line.tagNo ?? ""),
    itemNo: String(line.itemNo ?? ""),
    itemName: String(line.itemName ?? ""),
    receivingCategory: String(line.receivingCategory ?? "").toUpperCase() as InboundLine["receivingCategory"],
    heads: String(line.heads ?? "0"),
    palletId: String(line.palletId ?? fallbackHeader.palletId ?? ""),
    location: String(line.location ?? fallbackHeader.location ?? ""),
    prdDate: String(line.prdDate ?? ""),
    expDate: String(line.expDate ?? ""),
    quantity: String(line.quantity ?? "0"),
    weight: String(line.weight ?? "0"),
  }))

  return {
    ok: true as const,
    status: normalizeDocumentStatus(String(payload.status ?? "D")),
    isConfirmed: payload.isConfirmed ?? 0,
    confirmedBy: String(payload.confirmedBy ?? "").trim(),
    confirmedDateTime: String(payload.confirmedDateTime ?? "").trim(),
    lines,
  }
}

// // Load picker options (customers/items/locations/pallets).
// export async function loadCustomers(company: string, branch: string): Promise<CustomerOption[]> {
//   const result = await fetchCustomers(company, branch)
//   if (!result.ok) return []
//   return (result.data.customers ?? []) as CustomerOption[]
// }

// export async function loadItems(company: string, branch: string): Promise<ItemOption[]> {
//   const result = await fetchItems(company, branch)
//   if (!result.ok) return []
//   return (result.data.items ?? []) as ItemOption[]
// }

// export async function loadLocations(company: string, branch: string): Promise<LocationOption[]> {
//   const result = await fetchLocations(company, branch)
//   if (!result.ok) return []
//   return (result.data.locations ?? []) as LocationOption[]
// }

// export async function loadPalletAddresses(company: string, branch: string): Promise<PalletAddressOption[]> {
//   const result = await fetchPalletAddresses(company, branch)
//   if (!result.ok) return []
//   return (result.data.pallets ?? []) as PalletAddressOption[]
// }

// // Validate a location before saving.
// export async function validateLocation(company: string, branch: string, location: string) {
//   const result = await validateLocationRequest(company, branch, location)
//   if (!result.ok) {
//     return { ok: false as const, valid: false, message: result.message }
//   }
//   return {
//     ok: true as const,
//     valid: Boolean(result.data.valid),
//     message: result.data.message ?? "",
//   }
// }

// Validate a draft payload against server-side rules.
// export async function validateReceivingDraft(
//   company: string,
//   branch: string,
//   header: InboundHeader,
//   lines: InboundLine[]
// ) {
//   const payload = {
//     company,
//     branch,
//     lines: lines.map((line) => ({
//       u_batch: header.palletId.trim(),
//       u_location: header.location.trim(),
//       u_tagno: line.tagNo.trim(),
//     })),
//   }

//   const result = await validateReceivingDraftRequest(payload)
//   if (!result.ok) {
//     return { ok: false as const, message: result.message, errors: [] }
//   }

//   return {
//     ok: result.data.ok !== false,
//     message: result.data.message ?? "",
//     errors: result.data.errors ?? [],
//   }
// }
