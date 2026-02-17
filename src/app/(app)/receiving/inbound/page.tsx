"use client"

import * as React from "react"
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { SiteHeader } from "@/src/components/site-header"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/src/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/src/components/ui/dropdown-menu"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/src/components/ui/select"
import {Sheet,SheetContent,SheetDescription,SheetHeader,SheetTitle,} from "@/src/components/ui/sheet"
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow,} from "@/src/components/ui/table"
import {DOCUMENT_STATUS_LABELS,DOCUMENT_STATUS_VALUES,RECEIVING_CATEGORY_VALUES,RECEIVING_TYPE_LABELS,RECEIVING_TYPE_VALUES, type DocumentStatus,} from "@/src/lib/transaction-enums"
import type {CustomerOption,InboundHeader,InboundLine,ItemOption,LocationOption,PalletAddressOption,PutAwayStatus,} from "@/src/features/receiving/inbound/types"

const initialHeader: InboundHeader = {
  documentNo: "",
  customerNo: "",
  customerName: "",
  customerGroup: "",
  palletId: "",
  location: "",
  receivingType: "CS_RECEIVING",
  remarks: "",
}

function createLine(): InboundLine {
  return {
    id: "",
    tagNo: "",
    itemNo: "",
    itemName: "",
    receivingCategory: "",
    heads: "",
    palletId: "",
    location: "",
    prdDate: "",
    expDate: "",
    quantity: "1",
    weight: "",
  }
}

function normalizeStatus(status: DocumentStatus, putAwayStatus: PutAwayStatus): DocumentStatus {
  if (putAwayStatus === "NOT_PUTAWAY" && status !== "CN") {
    return "D"
  }
  return status
}

function putAwayStatusLabel(status: PutAwayStatus): string {
  if (status === "PUTAWAY") return "Confirmed"
  return "Not Confirmed"
}

function mapIsConfirmedToPutAwayStatus(isConfirmed: unknown): PutAwayStatus {
  const raw = String(isConfirmed ?? "").trim().toLowerCase()
  if (raw === "1" || raw === "true" || raw === "y" || raw === "yes") {
    return "PUTAWAY"
  }
  return "NOT_PUTAWAY"
}

function canEdit(status: DocumentStatus, putAwayStatus: PutAwayStatus): boolean {
  return normalizeStatus(status, putAwayStatus) === "D"
}

function sumBy(lines: InboundLine[], key: "quantity" | "heads" | "weight"): number {
  return lines.reduce((sum, line) => {
    const parsed = Number(line[key])
    if (Number.isNaN(parsed)) return sum
    return sum + parsed
  }, 0)
}

type HeaderErrorState = Partial<Record<"customerNo" | "customerName" | "palletId" | "location", boolean>>

type LineFieldErrorState = Partial<Record<"tagNo", boolean>>
type LineDraftErrorState = Partial<
  Record<
    "itemNo" | "tagNo" | "receivingCategory" | "prdDate" | "expDate" | "heads" | "weight",
    boolean
  >
>
type InboundDocumentRecord = {
  documentNo: string
  status: DocumentStatus
  isConfirmed: unknown
  confirmedBy: string
  confirmedDateTime: string
  hasSavedDraft: boolean
  updatedAt: string
  systemReceivingDate: string
  documentReceivingDate: string
  lineCount: number
  header: InboundHeader
  lines: InboundLine[]
  totalQty: number
  totalHeads: number
  totalWeight: number
}

function normalizeDocumentStatus(value: string): DocumentStatus {
  const status = value.trim().toUpperCase()
  if (status === "D" || status === "O" || status === "C" || status === "CN") return status
  if (status === "CANCELLED" || status === "CANCELED") return "CN"
  if (status === "CLOSE" || status === "CLOSED") return "C"
  if (status === "OPEN") return "O"
  return "D"
}

function normalizeReceivingType(value: string): InboundHeader["receivingType"] {
  const type = value.trim().toUpperCase()
  if (type === "CS_RETURN" || type.includes("RETURN")) return "CS_RETURN"
  return "CS_RECEIVING"
}

export default function InboundPage() {
  const fieldErrorClass = "border-red-500 focus-visible:ring-red-500/30"
  const pickerPageSize = 10
  const [header, setHeader] = React.useState<InboundHeader>(initialHeader)
  const [lines, setLines] = React.useState<InboundLine[]>([])
  const [headerErrors, setHeaderErrors] = React.useState<HeaderErrorState>({})
  const [lineErrors, setLineErrors] = React.useState<Record<string, LineFieldErrorState>>({})
  const [isSavingDraft, setIsSavingDraft] = React.useState(false)
  const [lineFormOpen, setLineFormOpen] = React.useState(false)
  const [editingLineId, setEditingLineId] = React.useState<string | null>(null)
  const [itemPickerOpen, setItemPickerOpen] = React.useState(false)
  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false)
  const [locationPickerOpen, setLocationPickerOpen] = React.useState(false)
  const [palletPickerOpen, setPalletPickerOpen] = React.useState(false)
  const [customerOptions, setCustomerOptions] = React.useState<CustomerOption[]>([])
  const [itemOptions, setItemOptions] = React.useState<ItemOption[]>([])
  const [locationOptions, setLocationOptions] = React.useState<LocationOption[]>([])
  const [palletOptions, setPalletOptions] = React.useState<PalletAddressOption[]>([])
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [itemSearch, setItemSearch] = React.useState("")
  const [locationSearch, setLocationSearch] = React.useState("")
  const [palletSearch, setPalletSearch] = React.useState("")
  const [customerPage, setCustomerPage] = React.useState(1)
  const [itemPage, setItemPage] = React.useState(1)
  const [locationPage, setLocationPage] = React.useState(1)
  const [palletPage, setPalletPage] = React.useState(1)
  const [lineDraft, setLineDraft] = React.useState<InboundLine>(createLine())
  const [lineDraftErrors, setLineDraftErrors] = React.useState<LineDraftErrorState>({})
  const [documentStatus, setDocumentStatus] = React.useState<DocumentStatus>("D")
  const [isConfirmed, setIsConfirmed] = React.useState<unknown>(0)
  const [confirmedBy, setConfirmedBy] = React.useState("")
  const [confirmedDateTime, setConfirmedDateTime] = React.useState("")
  const [hasSavedDraft, setHasSavedDraft] = React.useState(false)
  const [documentSheetOpen, setDocumentSheetOpen] = React.useState(false)
  const [selectedDocumentNo, setSelectedDocumentNo] = React.useState<string | null>(null)
  const [documents, setDocuments] = React.useState<InboundDocumentRecord[]>([])
  const [documentPage, setDocumentPage] = React.useState(1)
  const [documentPageSize, setDocumentPageSize] = React.useState(10)
  const [isLoadingDocuments, setIsLoadingDocuments] = React.useState(false)

  const putAwayStatus = React.useMemo(
    () => mapIsConfirmedToPutAwayStatus(isConfirmed),
    [isConfirmed]
  )
  const effectiveStatus = normalizeStatus(documentStatus, putAwayStatus)
  const editable = canEdit(documentStatus, putAwayStatus)
  const totalQty = React.useMemo(() => sumBy(lines, "quantity"), [lines])
  const totalHeads = React.useMemo(() => sumBy(lines, "heads"), [lines])
  const totalWeight = React.useMemo(() => sumBy(lines, "weight"), [lines])
  const totalDocuments = documents.length
  const totalDocumentPages = Math.max(1, Math.ceil(totalDocuments / documentPageSize))
  const draftDocumentCount = React.useMemo(
    () => documents.filter((doc) => doc.status === "D").length,
    [documents]
  )
  const confirmedDocumentCount = React.useMemo(
    () => documents.filter((doc) => doc.status === "C").length,
    [documents]
  )
  const cancelledDocumentCount = React.useMemo(
    () => documents.filter((doc) => doc.status === "CN").length,
    [documents]
  )
  const filteredCustomers = React.useMemo(() => {
    const q = customerSearch.trim().toLowerCase()
    if (!q) return customerOptions
    return customerOptions.filter((c) =>
      c.customerNo.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.groupName.toLowerCase().includes(q)
    )
  }, [customerOptions, customerSearch])
  const filteredItems = React.useMemo(() => {
    const q = itemSearch.trim().toLowerCase()
    if (!q) return itemOptions
    return itemOptions.filter((i) =>
      i.itemNo.toLowerCase().includes(q) ||
      i.itemName.toLowerCase().includes(q)
    )
  }, [itemOptions, itemSearch])
  const filteredLocations = React.useMemo(() => {
    const q = locationSearch.trim().toLowerCase()
    if (!q) return locationOptions
    return locationOptions.filter((l) => l.code.toLowerCase().includes(q))
  }, [locationOptions, locationSearch])
  const filteredPallets = React.useMemo(() => {
    const q = palletSearch.trim().toLowerCase()
    if (!q) return palletOptions
    return palletOptions.filter((p) => p.code.toLowerCase().includes(q))
  }, [palletOptions, palletSearch])
  const totalCustomerPages = Math.max(1, Math.ceil(filteredCustomers.length / pickerPageSize))
  const totalItemPages = Math.max(1, Math.ceil(filteredItems.length / pickerPageSize))
  const totalLocationPages = Math.max(1, Math.ceil(filteredLocations.length / pickerPageSize))
  const totalPalletPages = Math.max(1, Math.ceil(filteredPallets.length / pickerPageSize))
  const pagedCustomers = React.useMemo(() => {
    const start = (customerPage - 1) * pickerPageSize
    return filteredCustomers.slice(start, start + pickerPageSize)
  }, [filteredCustomers, customerPage, pickerPageSize])
  const pagedItems = React.useMemo(() => {
    const start = (itemPage - 1) * pickerPageSize
    return filteredItems.slice(start, start + pickerPageSize)
  }, [filteredItems, itemPage, pickerPageSize])
  const pagedLocations = React.useMemo(() => {
    const start = (locationPage - 1) * pickerPageSize
    return filteredLocations.slice(start, start + pickerPageSize)
  }, [filteredLocations, locationPage, pickerPageSize])
  const pagedPallets = React.useMemo(() => {
    const start = (palletPage - 1) * pickerPageSize
    return filteredPallets.slice(start, start + pickerPageSize)
  }, [filteredPallets, palletPage, pickerPageSize])
  const pagedDocuments = React.useMemo(() => {
    const start = (documentPage - 1) * documentPageSize
    return documents.slice(start, start + documentPageSize)
  }, [documents, documentPage, documentPageSize])

  const putAwayDetails = React.useMemo(() => {
    if (putAwayStatus === "PUTAWAY") {
      return {
        confirmedBy: confirmedBy || "System User",
        confirmedDate: confirmedDateTime || "Confirmed",
      }
    }

    return {
      confirmedBy: "Not yet confirmed",
      confirmedDate: "Not yet confirmed",
    }
  }, [putAwayStatus, confirmedBy, confirmedDateTime])

  const readCookie = React.useCallback((name: string): string => {
    const key = `${name}=`
    const part = document.cookie
      .split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith(key))
    return part ? decodeURIComponent(part.slice(key.length)) : ""
  }, [])

  const getCompanyBranch = React.useCallback(() => {
    const company = readCookie("active_company")
    const branch = readCookie("active_branch")
    return { company, branch }
  }, [readCookie])

  const loadReceivingDocuments = React.useCallback(async () => {
    const { company, branch } = getCompanyBranch()

    setIsLoadingDocuments(true)
    try {
      const qs = new URLSearchParams()
      if (company) qs.set("company", company)
      if (branch) qs.set("branch", branch)
      const suffix = qs.toString() ? `?${qs.toString()}` : ""
      const res = await fetch(`/api/receiving${suffix}`, { cache: "no-store" })
      if (!res.ok) {
        const failed = (await res.json()) as { message?: string; error?: string }
        toast.error(failed.message || "Failed to load inbound documents.")
        return
      }

      const payload = (await res.json()) as {
        documents?: Array<{
          documentNo?: string
          status?: string
          isConfirmed?: unknown
          confirmedBy?: string
          confirmedDateTime?: string
          receivingType?: string
          customerNo?: string
          customerName?: string
          customerGroup?: string
          palletId?: string
          location?: string
          remarks?: string
          systemReceivingDate?: string
          documentReceivingDate?: string
          totalQty?: number
          totalHeads?: number
          totalWeight?: number
        }>
      }

      if (!Array.isArray(payload.documents)) return

      const mapped = payload.documents
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
          } satisfies InboundDocumentRecord
        })

      setDocuments(mapped)
      setDocumentPage(1)
    } catch {
      toast.error("Failed to load inbound documents.")
    } finally {
      setIsLoadingDocuments(false)
    }
  }, [getCompanyBranch])

  const createDocumentNo = React.useCallback(() => {
    const year = new Date().getFullYear()
    const used = new Set(documents.map((doc) => doc.documentNo))
    let sequence = documents.length + 1
    let candidate = `INB-${year}-${String(sequence).padStart(6, "0")}`
    while (used.has(candidate)) {
      sequence += 1
      candidate = `INB-${year}-${String(sequence).padStart(6, "0")}`
    }
    return candidate
  }, [documents])

  const upsertDocumentFromCurrentState = (
    documentNo: string,
    nextStatus: DocumentStatus,
    nextHasSavedDraft: boolean
  ) => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ")
    const record: InboundDocumentRecord = {
      documentNo,
      status: nextStatus,
      isConfirmed,
      confirmedBy,
      confirmedDateTime,
      hasSavedDraft: nextHasSavedDraft,
      updatedAt: now,
      systemReceivingDate: now,
      documentReceivingDate: now.slice(0, 10),
      lineCount: lines.length,
      header: { ...header, documentNo },
      lines: lines.map((line) => ({ ...line })),
      totalQty,
      totalHeads,
      totalWeight,
    }

    setDocuments((prev) => {
      const index = prev.findIndex((doc) => doc.documentNo === documentNo)
      if (index < 0) return [record, ...prev]
      const next = [...prev]
      next[index] = record
      return next
    })
    setDocumentPage(1)
  }

  const resetDocumentEditor = (documentNo = "") => {
    setHeader({ ...initialHeader, documentNo })
    setLines([])
    setDocumentStatus("D")
    setIsConfirmed(0)
    setConfirmedBy("")
    setConfirmedDateTime("")
    setHasSavedDraft(false)
    setHeaderErrors({})
    setLineErrors({})
    setLineFormOpen(false)
    setEditingLineId(null)
    setLineDraft(createLine())
    setLineDraftErrors({})
  }

  const onCreateDocument = () => {
    const nextDocumentNo = createDocumentNo()
    resetDocumentEditor(nextDocumentNo)
    setSelectedDocumentNo(nextDocumentNo)
    setDocumentPage(1)
    setDocumentSheetOpen(true)
  }

  const onOpenDocument = async (documentNo: string) => {
    const target = documents.find((doc) => doc.documentNo === documentNo)
    if (!target) return
    setHeader({ ...target.header })
    setLines(target.lines.map((line) => ({ ...line })))
    setDocumentStatus(target.status)
    setIsConfirmed(target.isConfirmed)
    setConfirmedBy(target.confirmedBy)
    setConfirmedDateTime(target.confirmedDateTime)
    setHasSavedDraft(target.hasSavedDraft)
    setHeaderErrors({})
    setLineErrors({})
    setLineFormOpen(false)
    setEditingLineId(null)
    setLineDraft(createLine())
    setLineDraftErrors({})
    setSelectedDocumentNo(target.documentNo)
    setDocumentSheetOpen(true)

    const { company, branch } = getCompanyBranch()

    try {
      const qs = new URLSearchParams({ documentNo })
      if (company) qs.set("company", company)
      if (branch) qs.set("branch", branch)
      const res = await fetch(`/api/receiving?${qs.toString()}`, { cache: "no-store" })
      if (!res.ok) {
        const failed = (await res.json()) as { message?: string; error?: string }
        toast.error(failed.message || "Failed to load document lines.")
        return
      }

      const payload = (await res.json()) as {
        status?: string
        isConfirmed?: unknown
        confirmedBy?: string
        confirmedDateTime?: string
        lines?: Array<{
          lineNo?: string
          tagNo?: string
          itemNo?: string
          itemName?: string
          receivingCategory?: string
          prdDate?: string
          expDate?: string
          quantity?: string
          heads?: string
          weight?: string
          palletId?: string
          location?: string
        }>
      }

      if (!Array.isArray(payload.lines)) return

      const fetchedLines: InboundLine[] = payload.lines.map((line, index) => ({
        id: `${documentNo}-${line.lineNo ?? index + 1}-${line.tagNo ?? line.itemNo ?? index + 1}`,
        tagNo: String(line.tagNo ?? ""),
        itemNo: String(line.itemNo ?? ""),
        itemName: String(line.itemName ?? ""),
        receivingCategory: String(line.receivingCategory ?? "").toUpperCase() as InboundLine["receivingCategory"],
        heads: String(line.heads ?? "0"),
        palletId: String(line.palletId ?? target.header.palletId ?? ""),
        location: String(line.location ?? target.header.location ?? ""),
        prdDate: String(line.prdDate ?? ""),
        expDate: String(line.expDate ?? ""),
        quantity: String(line.quantity ?? "0"),
        weight: String(line.weight ?? "0"),
      }))
      const nextStatus = normalizeDocumentStatus(String(payload.status ?? target.status ?? "D"))
      const nextIsConfirmed = payload.isConfirmed ?? target.isConfirmed ?? 0
      const nextConfirmedBy = String(payload.confirmedBy ?? target.confirmedBy ?? "").trim()
      const nextConfirmedDateTime = String(
        payload.confirmedDateTime ?? target.confirmedDateTime ?? ""
      ).trim()

      setDocumentStatus(nextStatus)
      setIsConfirmed(nextIsConfirmed)
      setConfirmedBy(nextConfirmedBy)
      setConfirmedDateTime(nextConfirmedDateTime)
      setLines(fetchedLines)
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.documentNo === documentNo
            ? {
                ...doc,
                status: nextStatus,
                isConfirmed: nextIsConfirmed,
                confirmedBy: nextConfirmedBy,
                confirmedDateTime: nextConfirmedDateTime,
                hasSavedDraft: nextStatus === "D",
                lines: fetchedLines,
                lineCount: fetchedLines.length,
              }
            : doc
        )
      )
    } catch {
      toast.error("Failed to load document lines.")
    }
  }

  React.useEffect(() => {
    let isMounted = true

    const readCookie = (name: string): string => {
      const key = `${name}=`
      const part = document.cookie
        .split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith(key))
      return part ? decodeURIComponent(part.slice(key.length)) : ""
    }

    const company = readCookie("active_company")
    const branch = readCookie("active_branch")
    const qs = new URLSearchParams()
    if (company) qs.set("company", company)
    if (branch) qs.set("branch", branch)
    const suffix = qs.toString() ? `?${qs.toString()}` : ""

    const loadCustomers = async () => {
      try {
        const res = await fetch(`/api/customers${suffix}`, { cache: "no-store" })
        if (!res.ok) return
        const payload = (await res.json()) as { customers?: CustomerOption[] }
        if (isMounted && Array.isArray(payload.customers) && payload.customers.length > 0) {
          setCustomerOptions(payload.customers)
        }
      } catch {
        // keep local fallback
      }
    }

    const loadItems = async () => {
      try {
        const res = await fetch(`/api/items${suffix}`, { cache: "no-store" })
        if (!res.ok) return
        const payload = (await res.json()) as { items?: ItemOption[] }
        if (isMounted && Array.isArray(payload.items) && payload.items.length > 0) {
          setItemOptions(payload.items)
        }
      } catch {
        // keep local fallback
      }
    }

    const loadLocations = async () => {
      try {
        const res = await fetch(`/api/locations${suffix}`, { cache: "no-store" })
        if (!res.ok) return
        const payload = (await res.json()) as { locations?: LocationOption[] }
        if (isMounted && Array.isArray(payload.locations) && payload.locations.length > 0) {
          setLocationOptions(payload.locations)
        }
      } catch {
        // keep local fallback
      }
    }

    const loadPalletAddresses = async () => {
      try {
        const res = await fetch(`/api/pallet-addresses${suffix}`, { cache: "no-store" })
        if (!res.ok) return
        const payload = (await res.json()) as { pallets?: PalletAddressOption[] }
        if (isMounted && Array.isArray(payload.pallets) && payload.pallets.length > 0) {
          setPalletOptions(payload.pallets)
        }
      } catch {
        // keep local fallback
      }
    }

    loadCustomers()
    loadItems()
    loadLocations()
    loadPalletAddresses()

    return () => {
      isMounted = false
    }
  }, [])

  React.useEffect(() => {
    void loadReceivingDocuments()
  }, [loadReceivingDocuments])

  React.useEffect(() => {
    setCustomerPage((prev) => Math.min(prev, totalCustomerPages))
  }, [totalCustomerPages])

  React.useEffect(() => {
    setItemPage((prev) => Math.min(prev, totalItemPages))
  }, [totalItemPages])

  React.useEffect(() => {
    setLocationPage((prev) => Math.min(prev, totalLocationPages))
  }, [totalLocationPages])

  React.useEffect(() => {
    setPalletPage((prev) => Math.min(prev, totalPalletPages))
  }, [totalPalletPages])

  React.useEffect(() => {
    setDocumentPage((prev) => Math.min(prev, totalDocumentPages))
  }, [totalDocumentPages])

  const onDocStatusChange = (value: string) => {
    const next = value as DocumentStatus
    if (putAwayStatus === "NOT_PUTAWAY" && next !== "CN") {
      setDocumentStatus("D")
      const currentDocumentNo = header.documentNo.trim()
      if (currentDocumentNo) {
        upsertDocumentFromCurrentState(currentDocumentNo, "D", hasSavedDraft)
      }
      return
    }
    setDocumentStatus(next)
    const currentDocumentNo = header.documentNo.trim()
    if (currentDocumentNo) {
      upsertDocumentFromCurrentState(currentDocumentNo, next, hasSavedDraft)
    }
  }

  const onHeaderChange = (key: keyof InboundHeader, value: string) => {
    if (!editable) return
    setHeader((prev) => ({ ...prev, [key]: value }))
    if (key === "customerNo" || key === "customerName" || key === "palletId" || key === "location") {
      setHeaderErrors((prev) => ({ ...prev, [key]: false }))
    }
  }

  const onOpenAddLine = () => {
    if (!editable) return
    setLineDraft(createLine())
    setLineDraftErrors({})
    setEditingLineId(null)
    setItemSearch("")
    setItemPage(1)
    setLineFormOpen(true)
  }

  const onLineDraftChange = (key: keyof InboundLine, value: string) => {
    setLineDraft((prev) => ({ ...prev, [key]: value }))
    if (
      key === "itemNo" ||
      key === "tagNo" ||
      key === "receivingCategory" ||
      key === "prdDate" ||
      key === "expDate" ||
      key === "heads" ||
      key === "weight"
    ) {
      setLineDraftErrors((prev) => ({ ...prev, [key]: false }))
    }
    if (key === "tagNo" && editingLineId) {
      setLineErrors((prev) => ({
        ...prev,
        [editingLineId]: {
          ...(prev[editingLineId] ?? {}),
          tagNo: false,
        },
      }))
    }
  }

  const closeLineForm = () => {
    setLineFormOpen(false)
    setEditingLineId(null)
    setLineDraft(createLine())
    setLineDraftErrors({})
  }

  const onOpenCustomerPicker = async () => {
    if (!editable) return

    const readCookie = (name: string): string => {
      const key = `${name}=`
      const part = document.cookie
        .split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith(key))
      return part ? decodeURIComponent(part.slice(key.length)) : ""
    }

    const company = readCookie("active_company")
    const branch = readCookie("active_branch")
    const qs = new URLSearchParams()
    if (company) qs.set("company", company)
    if (branch) qs.set("branch", branch)
    const suffix = qs.toString() ? `?${qs.toString()}` : ""

    try {
      const res = await fetch(`/api/customers${suffix}`, { cache: "no-store" })
      if (res.ok) {
        const payload = (await res.json()) as { customers?: CustomerOption[] }
        if (Array.isArray(payload.customers) && payload.customers.length > 0) {
          setCustomerOptions(payload.customers)
        }
      }
    } catch {
      // keep existing list
    } finally {
      setCustomerSearch("")
      setCustomerPage(1)
      setCustomerPickerOpen(true)
    }
  }

  const onOpenLocationPicker = async () => {
    if (!editable) return

    const readCookie = (name: string): string => {
      const key = `${name}=`
      const part = document.cookie
        .split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith(key))
      return part ? decodeURIComponent(part.slice(key.length)) : ""
    }

    const company = readCookie("active_company")
    const branch = readCookie("active_branch")
    const qs = new URLSearchParams()
    if (company) qs.set("company", company)
    if (branch) qs.set("branch", branch)
    const suffix = qs.toString() ? `?${qs.toString()}` : ""

    try {
      const res = await fetch(`/api/locations${suffix}`, { cache: "no-store" })
      if (res.ok) {
        const payload = (await res.json()) as { locations?: LocationOption[] }
        if (Array.isArray(payload.locations) && payload.locations.length > 0) {
          setLocationOptions(payload.locations)
        }
      }
    } catch {
      // keep existing list
    } finally {
      setLocationSearch("")
      setLocationPage(1)
      setLocationPickerOpen(true)
    }
  }

  const onOpenPalletPicker = async () => {
    if (!editable) return

    const readCookie = (name: string): string => {
      const key = `${name}=`
      const part = document.cookie
        .split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith(key))
      return part ? decodeURIComponent(part.slice(key.length)) : ""
    }

    const company = readCookie("active_company")
    const branch = readCookie("active_branch")
    const qs = new URLSearchParams()
    if (company) qs.set("company", company)
    if (branch) qs.set("branch", branch)
    const suffix = qs.toString() ? `?${qs.toString()}` : ""

    try {
      const res = await fetch(`/api/pallet-addresses${suffix}`, { cache: "no-store" })
      if (res.ok) {
        const payload = (await res.json()) as { pallets?: PalletAddressOption[] }
        if (Array.isArray(payload.pallets) && payload.pallets.length > 0) {
          setPalletOptions(payload.pallets)
        }
      }
    } catch {
      // keep existing list
    } finally {
      setPalletSearch("")
      setPalletPage(1)
      setPalletPickerOpen(true)
    }
  }

  const onSelectCustomer = (customerNo: string, customerName: string, groupName: string) => {
    setHeader((prev) => ({ ...prev, customerNo, customerName, customerGroup: groupName }))
    setHeaderErrors((prev) => ({
      ...prev,
      customerNo: false,
      customerName: false,
    }))
    setCustomerPickerOpen(false)
  }

  const onSelectItem = (itemNo: string, itemName: string) => {
    setLineDraft((prev) => ({ ...prev, itemNo, itemName }))
    setLineDraftErrors((prev) => ({ ...prev, itemNo: false }))
    setItemPickerOpen(false)
  }

  const onSelectLocation = (code: string) => {
    setHeader((prev) => ({ ...prev, location: code }))
    setHeaderErrors((prev) => ({ ...prev, location: false }))
    setLocationPickerOpen(false)
    void validateHeaderLocation(code)
  }

  const onSelectPallet = (code: string) => {
    setHeader((prev) => ({ ...prev, palletId: code }))
    setHeaderErrors((prev) => ({ ...prev, palletId: false }))
    setPalletPickerOpen(false)
  }

  const validateLineDraft = (): { issues: string[]; fields: LineDraftErrorState } => {
    const issues: string[] = []
    const fields: LineDraftErrorState = {}

    const itemNo = lineDraft.itemNo.trim()
    const tagNo = lineDraft.tagNo.trim()
    const receivingCategory = String(lineDraft.receivingCategory ?? "").trim()
    const prdDate = lineDraft.prdDate.trim()
    const expDate = lineDraft.expDate.trim()
    const heads = Number(lineDraft.heads)
    const weight = Number(lineDraft.weight)

    if (!itemNo) {
      fields.itemNo = true
      issues.push("Item No is required.")
    }
    if (!tagNo) {
      fields.tagNo = true
      issues.push("Tag No is required.")
    }
    if (!receivingCategory) {
      fields.receivingCategory = true
      issues.push("Receiving Category is required.")
    }
    if (!prdDate) {
      fields.prdDate = true
      issues.push("PRD date is required.")
    }
    if (!expDate) {
      fields.expDate = true
      issues.push("EXP date is required.")
    }
    if (prdDate && expDate && expDate < prdDate) {
      fields.expDate = true
      issues.push("EXP date cannot be earlier than PRD date.")
    }
    if (!Number.isFinite(heads) || heads <= 0) {
      fields.heads = true
      issues.push("Heads/Packs must be greater than 0.")
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      fields.weight = true
      issues.push("Weight must be greater than 0.")
    }

    if (tagNo) {
      const normalizedTag = tagNo.toUpperCase()
      const duplicateTag = lines.some(
        (line) => line.id !== editingLineId && line.tagNo.trim().toUpperCase() === normalizedTag
      )
      if (duplicateTag) {
        fields.tagNo = true
        issues.push(`Tag No already exists in this document: ${tagNo}`)
      }
    }

    return { issues, fields }
  }

  const onSaveLineDraft = () => {
    if (!editable) return
    const validation = validateLineDraft()
    if (validation.issues.length > 0) {
      setLineDraftErrors(validation.fields)
      toast.error(editingLineId ? "Cannot save line item" : "Cannot add line item", {
        description: (
          <ul className="list-disc pl-4">
            {validation.issues.map((err, idx) => (
              <li key={`${err}-${idx}`}>{err}</li>
            ))}
          </ul>
        ),
      })
      return
    }

    const nextLine = {
      ...lineDraft,
      quantity: "1",
      palletId: header.palletId.trim(),
      location: header.location.trim(),
    }
    if (editingLineId) {
      setLines((prev) =>
        prev.map((line) => (line.id === editingLineId ? { ...nextLine, id: editingLineId } : line))
      )
    } else {
      setLines((prev) => [...prev, { ...nextLine, id: crypto.randomUUID() }])
    }
    closeLineForm()
  }

  const onRemoveLine = (id: string) => {
    if (!editable) return
    setLines((prev) => prev.filter((line) => line.id !== id))
    setLineErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const onEditLine = (id: string) => {
    if (!editable) return
    const target = lines.find((line) => line.id === id)
    if (!target) return
    setLineDraft({ ...target, quantity: "1" })
    setLineDraftErrors({})
    setEditingLineId(id)
    setLineFormOpen(true)
  }

  const onConfirm = () => {
    if (putAwayStatus === "NOT_PUTAWAY") return
    const nextStatus: DocumentStatus = "C"
    setDocumentStatus(nextStatus)
    const currentDocumentNo = header.documentNo.trim()
    if (currentDocumentNo) {
      upsertDocumentFromCurrentState(currentDocumentNo, nextStatus, hasSavedDraft)
    }
  }

  const onCancel = () => {
    if (!editable) return
    const nextStatus: DocumentStatus = "CN"
    setDocumentStatus(nextStatus)
    const currentDocumentNo = header.documentNo.trim()
    if (currentDocumentNo) {
      upsertDocumentFromCurrentState(currentDocumentNo, nextStatus, hasSavedDraft)
    }
  }

  const validateDraftLocally = (): {
    issues: string[]
    header: HeaderErrorState
    lines: Record<string, LineFieldErrorState>
  } => {
    const issues: string[] = []
    const nextHeaderErrors: HeaderErrorState = {}
    const nextLineErrors: Record<string, LineFieldErrorState> = {}

    if (!header.customerNo.trim()) {
      issues.push("Header: Customer No is required.")
      nextHeaderErrors.customerNo = true
    }
    if (!header.customerName.trim()) {
      issues.push("Header: Customer Name is required.")
      nextHeaderErrors.customerName = true
    }
    if (!header.palletId.trim()) {
      issues.push("Header: Pallet ID is required.")
      nextHeaderErrors.palletId = true
    }
    if (!header.location.trim()) {
      issues.push("Header: Location is required.")
      nextHeaderErrors.location = true
    }
    if (lines.length === 0) issues.push("At least one line item is required.")

    const barcodeSeen = new Map<string, string[]>()

    const markLineError = (lineId: string, field: keyof LineFieldErrorState) => {
      nextLineErrors[lineId] = { ...(nextLineErrors[lineId] ?? {}), [field]: true }
    }

    lines.forEach((line, index) => {
      const lineNo = index + 1
      const tagNo = line.tagNo.trim()

      if (!tagNo) {
        issues.push(`Line ${lineNo}: Barcode is required.`)
        markLineError(line.id, "tagNo")
      }

      if (tagNo) {
        const key = tagNo.toUpperCase()
        barcodeSeen.set(key, [...(barcodeSeen.get(key) ?? []), line.id])
      }
    })

    for (const [barcode, lineIds] of barcodeSeen) {
      if (lineIds.length > 1) {
        issues.push(`Duplicate barcode in this draft: ${barcode}`)
        lineIds.forEach((lineId) => markLineError(lineId, "tagNo"))
      }
    }
    return {
      issues,
      header: nextHeaderErrors,
      lines: nextLineErrors,
    }
  }

  const showDraftValidationErrors = (errors: string[]) => {
    toast.error("Cannot save draft", {
      description: (
        <ul className="list-disc pl-4">
          {errors.map((err, idx) => (
            <li key={`${err}-${idx}`}>{err}</li>
          ))}
        </ul>
      ),
    })
  }

  const hasHighlightedErrors = React.useMemo(() => {
    const headerHasError = Object.values(headerErrors).some((value) => Boolean(value))
    const linesHaveError = Object.values(lineErrors).some((lineError) =>
      Object.values(lineError ?? {}).some((value) => Boolean(value))
    )
    return headerHasError || linesHaveError
  }, [headerErrors, lineErrors])

  const validateHeaderLocation = async (locationValue: string) => {
    if (!editable) return
    const location = locationValue.trim()
    if (!location) return

    const readCookie = (name: string): string => {
      const key = `${name}=`
      const part = document.cookie
        .split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith(key))
      return part ? decodeURIComponent(part.slice(key.length)) : ""
    }

    const company = readCookie("active_company")
    const branch = readCookie("active_branch")
    if (!company || !branch) return

    try {
      const res = await fetch("/api/location-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          company,
          branch,
          location,
        }),
      })

      const payload = (await res.json()) as {
        valid?: boolean
        message?: string
      }

      if (!res.ok || payload.valid === false) {
        setHeaderErrors((prev) => ({ ...prev, location: true }))
        toast.error(payload.message || "Location is invalid or already occupied.")
        return
      }

      setHeaderErrors((prev) => ({ ...prev, location: false }))
    } catch {
      toast.error("Failed to validate location.")
    }
  }

  const onSaveDraft = async () => {
    if (documentStatus === "CN") return
    if (!editable) return
    if (hasHighlightedErrors) {
      toast.error(`Cannot ${hasSavedDraft ? "update" : "add"} draft`, {
        description: "Fix highlighted fields first.",
      })
      return
    }

    setIsSavingDraft(true)
    setHeaderErrors({})
    setLineErrors({})

    const localValidation = validateDraftLocally()
    if (localValidation.issues.length > 0) {
      setHeaderErrors(localValidation.header)
      setLineErrors(localValidation.lines)
      showDraftValidationErrors(localValidation.issues)
      setIsSavingDraft(false)
      return
    }

    const readCookie = (name: string): string => {
      const key = `${name}=`
      const part = document.cookie
        .split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith(key))
      return part ? decodeURIComponent(part.slice(key.length)) : ""
    }

    const company = readCookie("active_company")
    const branch = readCookie("active_branch")
    if (!company || !branch) {
      showDraftValidationErrors(["Active company/branch is missing. Select branch first."])
      setIsSavingDraft(false)
      return
    }

    try {
      const seriesName = header.receivingType === "CS_RETURN" ? "CS Return" : "CS Receive"
      const draftDocStatus = "D"
      const fullDraftPayload = {
        type: hasSavedDraft ? "receivingdraftupdate" : "receivingdraftadd",
        company,
        branch,
        header: {
          docstatus: draftDocStatus,
          documentNo: header.documentNo.trim(),
          customerNo: header.customerNo.trim(),
          customerName: header.customerName.trim(),
          customerGroup: header.customerGroup.trim(),
          receivingType: header.receivingType,
          seriesName,
          palletId: header.palletId.trim(),
          location: header.location.trim(),
          remarks: header.remarks.trim(),
          totalQty,
          totalHeads,
          totalWeight,
        },
        lines: lines.map((line, index) => ({
          lineNo: index + 1,
          tagNo: line.tagNo.trim(),
          itemNo: line.itemNo.trim(),
          itemName: line.itemName.trim(),
          receivingCategory: line.receivingCategory,
          prdDate: line.prdDate || null,
          expDate: line.expDate || null,
          quantity: Number(line.quantity || 0),
          heads: Number(line.heads || 0),
          weight: Number(line.weight || 0),
          palletId: header.palletId.trim(),
          location: header.location.trim(),
        })),
      }
      console.log("[Inbound] Draft full payload", fullDraftPayload)

      const validationPayload = {
        company,
        branch,
        lines: lines.map((line) => ({
          u_batch: header.palletId.trim(),
          u_location: header.location.trim(),
          u_tagno: line.tagNo.trim(),
        })),
      }
      console.log("[Inbound] Draft validation payload", validationPayload)

      const res = await fetch("/api/receiving-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(validationPayload),
      })

      const payload = (await res.json()) as {
        ok?: boolean
        message?: string
        errors?: Array<{ lineNo?: number | string; field?: string; code?: string; message?: string }>
      }

      if (!res.ok) {
        showDraftValidationErrors([payload.message ?? "Failed to validate draft."])
        setIsSavingDraft(false)
        return
      }

      const serverErrors = (payload.errors ?? [])
        .map((err) => {
          const linePrefix = err.lineNo ? `Line ${err.lineNo}: ` : ""
          if (err.message && err.message.trim()) return `${linePrefix}${err.message}`
          if (err.field && err.code) return `${linePrefix}${err.field} already exists (${err.code}).`
          return ""
        })
        .filter((msg) => msg.length > 0)

      const nextServerLineErrors: Record<string, LineFieldErrorState> = {}
      const nextServerHeaderErrors: HeaderErrorState = {}
      const markServerLineError = (lineId: string, field: keyof LineFieldErrorState) => {
        nextServerLineErrors[lineId] = { ...(nextServerLineErrors[lineId] ?? {}), [field]: true }
      }
      ;(payload.errors ?? []).forEach((err) => {
        const field = String(err.field ?? "").toLowerCase()
        if (field.includes("batch") || field.includes("pallet")) {
          nextServerHeaderErrors.palletId = true
        }
        if (field.includes("location")) {
          nextServerHeaderErrors.location = true
        }
        const parsedLineNo = Number(err.lineNo)
        const lineIndex = Number.isFinite(parsedLineNo) ? parsedLineNo - 1 : -1
        if (lineIndex < 0 || lineIndex >= lines.length) return
        const lineId = lines[lineIndex].id
        if (field.includes("tag")) markServerLineError(lineId, "tagNo")
      })

      if (payload.ok === false || serverErrors.length > 0) {
        if (Object.keys(nextServerHeaderErrors).length > 0) {
          setHeaderErrors((prev) => ({ ...prev, ...nextServerHeaderErrors }))
        }
        if (Object.keys(nextServerLineErrors).length > 0) {
          setLineErrors(nextServerLineErrors)
        }
        showDraftValidationErrors(serverErrors.length > 0 ? serverErrors : ["Draft validation failed."])
        setIsSavingDraft(false)
        return
      }
    } catch {
      showDraftValidationErrors(["Failed to validate draft. Please try again."])
      setIsSavingDraft(false)
      return
    }

    const resolvedDocumentNo = header.documentNo.trim() || createDocumentNo()
    if (resolvedDocumentNo !== header.documentNo) {
      setHeader((prev) => ({ ...prev, documentNo: resolvedDocumentNo }))
    }
    setDocumentStatus("D")
    setHasSavedDraft(true)
    setSelectedDocumentNo(resolvedDocumentNo)
    upsertDocumentFromCurrentState(resolvedDocumentNo, "D", true)
    setIsSavingDraft(false)
    toast.success(hasSavedDraft ? "Draft updated." : "Draft saved.")
  }

  const onRemoveDraft = () => {
    if (!editable) return
    const currentDocumentNo = header.documentNo.trim()
    if (currentDocumentNo) {
      setDocuments((prev) => prev.filter((doc) => doc.documentNo !== currentDocumentNo))
    }
    setSelectedDocumentNo(null)
    resetDocumentEditor()
    setDocumentSheetOpen(false)
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
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
                            <TableCell>{document.status} - {DOCUMENT_STATUS_LABELS[document.status]}</TableCell>
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

            <Sheet
              open={documentSheetOpen}
              onOpenChange={(open) => {
                setDocumentSheetOpen(open)
                if (!open) {
                  closeLineForm()
                  setCustomerPickerOpen(false)
                  setItemPickerOpen(false)
                  setLocationPickerOpen(false)
                  setPalletPickerOpen(false)
                }
              }}
            >
              <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[92vw]">
                <SheetHeader>
                  <SheetTitle>{selectedDocumentNo ?? "Inbound Document Details"}</SheetTitle>
                  <SheetDescription>
                    Manage inbound header and line details in this sheet.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
                    <Label htmlFor="documentNo">Document No</Label>
                    <Input
                      id="documentNo"
                      value={header.documentNo}
                      placeholder="INB-YYYY-000001"
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="space-y-1 md:justify-self-end md:w-full md:max-w-105">
                    <Label htmlFor="doc-status">Doc Status</Label>
                    <Select value={effectiveStatus} onValueChange={onDocStatusChange}>
                      <SelectTrigger id="doc-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_STATUS_VALUES.map((status) => (
                          <SelectItem
                            key={status}
                            value={status}
                            disabled={putAwayStatus === "NOT_PUTAWAY" && (status === "O" || status === "C")}
                          >
                            {status} - {DOCUMENT_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
                    <Label htmlFor="customerNo">Customer No</Label>
                    <div className="flex gap-2">
                      <Input
                        id="customerNo"
                        className={headerErrors.customerNo ? fieldErrorClass : undefined}
                        value={header.customerNo}
                        placeholder="Select customer"
                        readOnly
                        onClick={onOpenCustomerPicker}
                        disabled={!editable}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Select customer"
                        title="Select customer"
                        onClick={onOpenCustomerPicker}
                        disabled={!editable}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 md:justify-self-end md:w-full md:max-w-105">
                    <Label>Put Away Status</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          {putAwayStatusLabel(putAwayStatus)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-65">
                        <DropdownMenuLabel>Put Away Details</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-sm">
                          <p className="text-muted-foreground">Confirmed By</p>
                          <p className="font-medium">{putAwayDetails.confirmedBy}</p>
                        </div>
                        <div className="px-2 py-1.5 text-sm">
                          <p className="text-muted-foreground">Confirmed Date</p>
                          <p className="font-medium">{putAwayDetails.confirmedDate}</p>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      className={headerErrors.customerName ? fieldErrorClass : undefined}
                      value={header.customerName}
                      placeholder="Customer name"
                      readOnly
                      disabled={!editable}
                    />
                  </div>
                  <div className="space-y-1 md:justify-self-end md:w-full md:max-w-105">
                    <Label htmlFor="receivingType">Receiving Type</Label>
                    <Select
                      value={header.receivingType}
                      onValueChange={(value) =>
                        onHeaderChange("receivingType", value as InboundHeader["receivingType"])
                      }
                      disabled={!editable}
                    >
                      <SelectTrigger id="receivingType" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECEIVING_TYPE_VALUES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {RECEIVING_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
                    <Label htmlFor="customerGroup">Customer Group</Label>
                    <Input
                      id="customerGroup"
                      value={header.customerGroup}
                      placeholder="Customer group"
                      readOnly
                      disabled={!editable}
                    />
                  </div>
                  <div className="space-y-1 md:justify-self-end md:w-full md:max-w-105">
                    <Label htmlFor="palletId">Pallet ID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="palletId"
                        className={headerErrors.palletId ? fieldErrorClass : undefined}
                        value={header.palletId}
                        placeholder="Select pallet"
                        readOnly
                        onClick={onOpenPalletPicker}
                        disabled={!editable}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Select pallet"
                        title="Select pallet"
                        onClick={onOpenPalletPicker}
                        disabled={!editable}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
                    <Label htmlFor="location">Location</Label>
                    <div className="flex gap-2">
                      <Input
                        id="location"
                        className={headerErrors.location ? fieldErrorClass : undefined}
                        value={header.location}
                        placeholder="Select location"
                        readOnly
                        onClick={onOpenLocationPicker}
                        disabled={!editable}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Select location"
                        title="Select location"
                        onClick={onOpenLocationPicker}
                        disabled={!editable}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 md:col-span-2 md:justify-self-start md:w-full md:max-w-105">
                    <Label htmlFor="remarks">Remarks</Label>
                    <textarea
                      id="remarks"
                      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring/50 min-h-24 max-h-40 w-full max-w-105 resize-none overflow-y-auto rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                      value={header.remarks}
                      onChange={(e) => onHeaderChange("remarks", e.target.value)}
                      placeholder="Optional remarks"
                      disabled={!editable}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Line Items</CardTitle> 
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onOpenAddLine} disabled={!editable}>
                      <Plus className="size-4" />
                      Add Line
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-105 overflow-auto rounded-lg border">
                  <Table className="min-w-295">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">#</TableHead>
                        <TableHead className="min-w-44">Tag No</TableHead>
                        <TableHead className="min-w-40">Item No</TableHead>
                        <TableHead className="min-w-72">Item Name</TableHead>
                        <TableHead className="min-w-48">Receiving Category</TableHead>
                        <TableHead>PRD</TableHead>
                        <TableHead>EXP</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Heads/Packs</TableHead>
                        <TableHead className="text-right">Weight</TableHead>
                        <TableHead className="w-28" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="h-24 text-center">
                            <p className="text-muted-foreground text-sm">No line items yet.</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        lines.map((line, index) => (
                        <TableRow key={line.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div
                              className={`bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-sm whitespace-normal break-all ${
                                lineErrors[line.id]?.tagNo ? "border-red-500" : "border-input"
                              }`}
                              title={line.tagNo}
                            >
                              {line.tagNo || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-sm whitespace-normal break-all"
                              title={line.itemNo}
                            >
                              {line.itemNo || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-sm whitespace-normal wrap-break-word"
                              title={line.itemName}
                            >
                              {line.itemName || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-sm whitespace-normal wrap-break-word"
                              title={line.receivingCategory}
                            >
                              {line.receivingCategory || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-sm whitespace-nowrap"
                              title={line.prdDate}
                            >
                              {line.prdDate || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-sm whitespace-nowrap"
                              title={line.expDate}
                            >
                              {line.expDate || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-right text-sm whitespace-nowrap"
                              title={line.quantity}
                            >
                              {line.quantity || "0"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-right text-sm whitespace-nowrap"
                              title={line.heads}
                            >
                              {line.heads || "0"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="border-input bg-muted/20 min-h-9 rounded-md border px-3 py-2 text-right text-sm whitespace-nowrap"
                              title={line.weight}
                            >
                              {line.weight || "0"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onEditLine(line.id)}
                                disabled={!editable}
                                aria-label="Edit line"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onRemoveLine(line.id)}
                                disabled={!editable}
                                aria-label="Remove line"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                  <div className="rounded-md border bg-muted/20 p-3 text-sm">
                    <p><span className="font-medium">Total Qty:</span> {totalQty}</p>
                    <p><span className="font-medium">Total Heads/Packs:</span> {totalHeads}</p>
                    <p><span className="font-medium">Total Weight:</span> {totalWeight}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="size-4" />
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Document Action</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onConfirm} disabled={putAwayStatus === "NOT_PUTAWAY"}>
                        Confirm
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onCancel} disabled={!editable} variant="destructive">
                        Cancel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onSaveDraft} disabled={documentStatus === "CN" || isSavingDraft}>
                        {isSavingDraft ? "Validating..." : hasSavedDraft ? "Update Draft" : "Add Draft"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onRemoveDraft} disabled={!editable}>
                        Remove Draft
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>

            <Sheet
              open={lineFormOpen}
              onOpenChange={(open) => {
                setLineFormOpen(open)
                if (!open) {
                  setEditingLineId(null)
                  setLineDraft(createLine())
                  setLineDraftErrors({})
                }
              }}
            >
              <SheetContent side="right" className="w-full sm:max-w-xl" onInteractOutside={(e) => {
                if (itemPickerOpen) e.preventDefault()
              }}>
                <SheetHeader>
                  <SheetTitle>{editingLineId ? "Edit Line Item" : "Add Line Item"}</SheetTitle>
                  <SheetDescription>
                    {editingLineId
                      ? "Update the line details, then save changes."
                      : "Fill in the line details, then save to the table."}
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1 md:col-span-2">
                      <Label>Item No</Label>
                      <div className="flex gap-2">
                        <Input
                          className={lineDraftErrors.itemNo ? fieldErrorClass : undefined}
                          value={lineDraft.itemNo}
                          readOnly
                          placeholder="Select item"
                        />
                        <Button
                          variant="outline"
                          size="icon-sm"
                          type="button"
                          aria-label="Select item"
                          title="Select item"
                          onClick={() => {
                            setItemSearch("")
                            setItemPage(1)
                            setItemPickerOpen(true)
                          }}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label>Item Name</Label>
                      <Input value={lineDraft.itemName} readOnly placeholder="Auto-filled from item selection" />
                    </div>

                    <div className="space-y-1">
                      <Label>Tag No</Label>
                      <Input
                        className={lineDraftErrors.tagNo ? fieldErrorClass : undefined}
                        value={lineDraft.tagNo}
                        onChange={(e) => onLineDraftChange("tagNo", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Receiving Category</Label>
                      <Select
                        value={lineDraft.receivingCategory}
                        onValueChange={(value) => onLineDraftChange("receivingCategory", value)}
                      >
                        <SelectTrigger className={lineDraftErrors.receivingCategory ? fieldErrorClass : undefined}>
                          <SelectValue placeholder="Select receiving category" />
                        </SelectTrigger>
                        <SelectContent>
                          {RECEIVING_CATEGORY_VALUES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>PRD</Label>
                      <Input
                        className={lineDraftErrors.prdDate ? fieldErrorClass : undefined}
                        type="date"
                        value={lineDraft.prdDate}
                        onChange={(e) => onLineDraftChange("prdDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>EXP</Label>
                      <Input
                        className={lineDraftErrors.expDate ? fieldErrorClass : undefined}
                        type="date"
                        value={lineDraft.expDate}
                        onChange={(e) => onLineDraftChange("expDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Qty</Label>
                      <Input type="number" value="1" readOnly disabled />
                    </div>
                    <div className="space-y-1">
                      <Label>Heads/Packs</Label>
                      <Input
                        className={lineDraftErrors.heads ? fieldErrorClass : undefined}
                        type="number"
                        value={lineDraft.heads}
                        onChange={(e) => onLineDraftChange("heads", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label>Weight</Label>
                      <Input
                        className={lineDraftErrors.weight ? fieldErrorClass : undefined}
                        type="number"
                        value={lineDraft.weight}
                        onChange={(e) => onLineDraftChange("weight", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeLineForm}>Cancel</Button>
                    <Button onClick={onSaveLineDraft}>
                      {editingLineId ? "Save Changes" : "Add Line"}
                    </Button>
                  </div>
                </div>

                {itemPickerOpen && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg">
                      <div className="flex items-center justify-between border-b px-4 py-3">
                        <h3 className="text-base font-semibold">Item List</h3>
                        <Button variant="outline" size="sm" onClick={() => setItemPickerOpen(false)}>
                          Close
                        </Button>
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto p-2">
                        <div className="px-3 py-2">
                          <Input
                            value={itemSearch}
                            onChange={(e) => {
                              setItemSearch(e.target.value)
                              setItemPage(1)
                            }}
                            placeholder="Search item no or item name"
                          />
                        </div>
                        <div className="grid grid-cols-[180px_1fr] gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                          <div>Item No</div>
                          <div>Item Name</div>
                        </div>
                        {filteredItems.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-muted-foreground">No items found.</div>
                        ) : (
                          pagedItems.map((item) => (
                            <button
                              key={item.itemNo}
                              type="button"
                              className="hover:bg-accent grid w-full grid-cols-[180px_1fr] gap-2 rounded-md px-3 py-2 text-left text-sm"
                              onClick={() => onSelectItem(item.itemNo, item.itemName)}
                            >
                              <span>{item.itemNo}</span>
                              <span>{item.itemName}</span>
                            </button>
                          ))
                        )}
                        {filteredItems.length > 0 && (
                          <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                            <span>Page {itemPage} of {totalItemPages}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setItemPage((prev) => Math.max(1, prev - 1))}
                                disabled={itemPage === 1}
                              >
                                Prev
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setItemPage((prev) => Math.min(totalItemPages, prev + 1))}
                                disabled={itemPage === totalItemPages}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {customerPickerOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-background w-full max-w-3xl overflow-hidden rounded-lg border shadow-lg">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-base font-semibold">Select Customer</h3>
                    <Button variant="outline" size="sm" onClick={() => setCustomerPickerOpen(false)}>
                      Close
                    </Button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                    <div className="px-3 py-2">
                      <Input
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value)
                          setCustomerPage(1)
                        }}
                        placeholder="Search customer no, name, or group"
                      />
                    </div>
                    <div className="grid grid-cols-[160px_1fr_180px] gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                      <div>Customer No</div>
                      <div>Customer Name</div>
                      <div>Customer Group</div>
                    </div>
                    {filteredCustomers.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-muted-foreground">No customers found.</div>
                    ) : (
                      pagedCustomers.map((customer) => (
                        <button
                          key={customer.customerNo}
                          type="button"
                          className="hover:bg-accent grid w-full grid-cols-[160px_1fr_180px] gap-2 rounded-md px-3 py-2 text-left text-sm"
                          onClick={() =>
                            onSelectCustomer(
                              customer.customerNo,
                              customer.customerName,
                              customer.groupName
                            )
                          }
                        >
                          <span>{customer.customerNo}</span>
                          <span>{customer.customerName}</span>
                          <span>{customer.groupName}</span>
                        </button>
                      ))
                    )}
                    {filteredCustomers.length > 0 && (
                      <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                        <span>Page {customerPage} of {totalCustomerPages}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCustomerPage((prev) => Math.max(1, prev - 1))}
                            disabled={customerPage === 1}
                          >
                            Prev
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCustomerPage((prev) => Math.min(totalCustomerPages, prev + 1))}
                            disabled={customerPage === totalCustomerPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {locationPickerOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-background w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-base font-semibold">Select Location</h3>
                    <Button variant="outline" size="sm" onClick={() => setLocationPickerOpen(false)}>
                      Close
                    </Button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                    <div className="px-3 py-2">
                      <Input
                        value={locationSearch}
                        onChange={(e) => {
                          setLocationSearch(e.target.value)
                          setLocationPage(1)
                        }}
                        placeholder="Search location code"
                      />
                    </div>
                    <div className="grid grid-cols-[1fr] gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                      <div>Location</div>
                    </div>
                    {filteredLocations.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-muted-foreground">No locations found.</div>
                    ) : (
                      pagedLocations.map((location) => (
                        <button
                          key={location.code}
                          type="button"
                          className="hover:bg-accent grid w-full grid-cols-[1fr] gap-2 rounded-md px-3 py-2 text-left text-sm"
                          onClick={() => onSelectLocation(location.code)}
                        >
                          <span>{location.code}</span>
                        </button>
                      ))
                    )}
                    {filteredLocations.length > 0 && (
                      <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                        <span>Page {locationPage} of {totalLocationPages}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setLocationPage((prev) => Math.max(1, prev - 1))}
                            disabled={locationPage === 1}
                          >
                            Prev
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setLocationPage((prev) => Math.min(totalLocationPages, prev + 1))}
                            disabled={locationPage === totalLocationPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {palletPickerOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-background w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-base font-semibold">Select Pallet</h3>
                    <Button variant="outline" size="sm" onClick={() => setPalletPickerOpen(false)}>
                      Close
                    </Button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                    <div className="px-3 py-2">
                      <Input
                        value={palletSearch}
                        onChange={(e) => {
                          setPalletSearch(e.target.value)
                          setPalletPage(1)
                        }}
                        placeholder="Search pallet code"
                      />
                    </div>
                    <div className="grid grid-cols-[1fr] gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                      <div>Pallet</div>
                    </div>
                    {filteredPallets.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-muted-foreground">No pallet addresses found.</div>
                    ) : (
                      pagedPallets.map((pallet) => (
                        <button
                          key={pallet.code}
                          type="button"
                          className="hover:bg-accent grid w-full grid-cols-[1fr] gap-2 rounded-md px-3 py-2 text-left text-sm"
                          onClick={() => onSelectPallet(pallet.code)}
                        >
                          <span>{pallet.code}</span>
                        </button>
                      ))
                    )}
                    {filteredPallets.length > 0 && (
                      <div className="mt-2 flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                        <span>Page {palletPage} of {totalPalletPages}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPalletPage((prev) => Math.max(1, prev - 1))}
                            disabled={palletPage === 1}
                          >
                            Prev
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPalletPage((prev) => Math.min(totalPalletPages, prev + 1))}
                            disabled={palletPage === totalPalletPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </>
  )
}
