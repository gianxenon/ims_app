"use client"

import * as React from "react"
import { toast } from "sonner"

import type { DocumentStatus } from "@/src/shared/transaction-enums"
import type { CustomerOption, InboundHeader, InboundLine, ItemOption, LocationOption, PalletAddressOption } from "@/src/domain/receiving/inbound"
import type { InboundDocumentRecord } from "@/src/application/dto/receiving/inbound"
import {
  loadCustomers as loadCustomersUseCase,
  loadItems as loadItemsUseCase,
  loadLocations as loadLocationsUseCase,
  loadPalletAddresses as loadPalletAddressesUseCase,
  loadReceivingDocumentLines,
  loadReceivingDocuments as loadReceivingDocumentsUseCase,
  validateLocation as validateLocationUseCase,
  validatePalletAddress as validatePalletAddressUseCase,
  validateReceivingDraft as validateReceivingDraftUseCase,
  saveReceivingDraft as saveReceivingDraftUseCase,
} from "@/src/application/use-cases/receiving/inbound"
import {

  createLine,
  initialHeader,
  mapIsConfirmedToPutAwayStatus,
  normalizeStatus,
  sumBy,
} from "./inbound-helpers"
import { canEdit } from "@/src/types/documentTable" 

// Lightweight error flags for form validation.
type HeaderErrorState = Partial<Record<"customerNo" | "customerName" | "palletId" | "location", boolean>>

type LineFieldErrorState = Partial<Record<"tagNo", boolean>>
type LineDraftErrorState = Partial<
  Record<
    "itemNo" | "tagNo" | "receivingCategory" | "prdDate" | "expDate" | "heads" | "weight",
    boolean
  >
>
// Fully materialized document records are defined at the application layer.

const createLineId = () =>
  globalThis.crypto?.randomUUID?.() ?? `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`

export function useInbound() {
  // UI constants
  const fieldErrorClass = "border-red-500 focus-visible:ring-red-500/30"
  const pickerPageSize = 10

  // Core document editor state
  const [header, setHeader] = React.useState<InboundHeader>(initialHeader)

  const [lines, setLines] = React.useState<InboundLine[]>([])
  const [currentUserId, setCurrentUserId] = React.useState("")

  // Validation and UI flags
  const [headerErrors, setHeaderErrors] = React.useState<HeaderErrorState>({})
  const [lineErrors, setLineErrors] = React.useState<Record<string, LineFieldErrorState>>({})
  const [isSavingDraft, setIsSavingDraft] = React.useState(false)
  const [lineFormOpen, setLineFormOpen] = React.useState(false)
  const [editingLineId, setEditingLineId] = React.useState<string | null>(null)
  const [itemPickerOpen, setItemPickerOpen] = React.useState(false)
  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false)
  const [locationPickerOpen, setLocationPickerOpen] = React.useState(false)
  const [palletPickerOpen, setPalletPickerOpen] = React.useState(false)

  // Picker data
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

  // Draft line editor
  const [lineDraft, setLineDraft] = React.useState<InboundLine>(createLine())
  const [lineDraftErrors, setLineDraftErrors] = React.useState<LineDraftErrorState>({})

  // Document header status + confirmation
  const [documentStatus, setDocumentStatus] = React.useState<DocumentStatus>("D")
  const [isConfirmed, setIsConfirmed] = React.useState<unknown>(0)
  const [confirmedBy, setConfirmedBy] = React.useState("")
  const [confirmedDateTime, setConfirmedDateTime] = React.useState("")
  const [hasSavedDraft, setHasSavedDraft] = React.useState(false)

  // Document list + selection
  const [documentSheetOpen, setDocumentSheetOpen] = React.useState(false)
  const [selectedDocumentNo, setSelectedDocumentNo] = React.useState<string | null>(null)
  const [documents, setDocuments] = React.useState<InboundDocumentRecord[]>([])
  const [documentPage, setDocumentPage] = React.useState(1)
  const [documentPageSize, setDocumentPageSize] = React.useState(10)
  const [isLoadingDocuments, setIsLoadingDocuments] = React.useState(false)

  // Derived status values
  const putAwayStatus = React.useMemo(
    () => mapIsConfirmedToPutAwayStatus(isConfirmed),
    [isConfirmed]
  )
  const effectiveStatus = normalizeStatus(documentStatus, putAwayStatus)
  const editable = canEdit(documentStatus)

  // InboundSummary values
  const totalQty = React.useMemo(() => sumBy(lines, "quantity"), [lines])
  const totalHeads = React.useMemo(() => sumBy(lines, "heads"), [lines])
  const totalWeight = React.useMemo(() => sumBy(lines, "weight"), [lines])
  const totalDocuments = documents.length
  const totalDocumentPages = Math.max(1, Math.ceil(totalDocuments / documentPageSize)) 
  const draftDocumentCount = React.useMemo(() => documents.filter((doc) => doc.status === "D").length, [documents]  )
  const confirmedDocumentCount = React.useMemo( () => documents.filter((doc) => doc.status === "O").length, [documents] )
  const cancelledDocumentCount = React.useMemo( () => documents.filter((doc) => doc.status === "CN").length, [documents] )
  
  
  // Client-side filtering for picker lists.
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
  // Paging for picker lists.
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
  // Paging for saved documents table.
  const pagedDocuments = React.useMemo(() => {
    const start = (documentPage - 1) * documentPageSize
    return documents.slice(start, start + documentPageSize)
  }, [documents, documentPage, documentPageSize])

  // Friendly confirmation details shown on the UI.
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

  // Read cookie values on the client for company/branch context.
  const readCookie = React.useCallback((name: string): string => {
    const key = `${name}=`
    const part = document.cookie
      .split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith(key))
    return part ? decodeURIComponent(part.slice(key.length)) : ""
  }, [])

  // Centralized accessor for the active company/branch selection.
  const getCompanyBranch = React.useCallback(() => {
    const company = readCookie("active_company")
    const branch = readCookie("active_branch")
    return { company, branch }
  }, [readCookie])

  // Load the latest receiving documents list from the API.
  const loadReceivingDocuments = React.useCallback(async () => {
    const { company, branch } = getCompanyBranch()

    setIsLoadingDocuments(true)
    try {
      const result = await loadReceivingDocumentsUseCase(company, branch)
      if (!result.ok) {
        toast.error(result.message || "Failed to load inbound documents.")
        return
      }

      setDocuments(result.documents)
      setDocumentPage(1)
    } catch {
      toast.error("Failed to load inbound documents.")
    } finally {
      setIsLoadingDocuments(false)
    }
  }, [getCompanyBranch])

  // Generate a unique document number (client-side) for a new draft.
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

  // Persist the current in-memory editor state into the documents list.
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

  // Reset editor UI to a clean state, optionally using a new document number.
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

  // Start a new document draft.
  const onCreateDocument = () => {
    const nextDocumentNo = createDocumentNo()
    resetDocumentEditor(nextDocumentNo)
    setSelectedDocumentNo(nextDocumentNo)
    setDocumentPage(1)
    setDocumentSheetOpen(true)
  }

  // Load an existing document into the editor (and fetch its lines).
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
      const result = await loadReceivingDocumentLines(company, branch, documentNo, target.header)
      if (!result.ok) {
        toast.error(result.message || "Failed to load document lines.")
        return
      }

      const fetchedLines = result.lines
      const nextStatus = result.status
      const nextIsConfirmed = result.isConfirmed ?? target.isConfirmed ?? 0
      const nextConfirmedBy = String(result.confirmedBy ?? target.confirmedBy ?? "").trim()
      const nextConfirmedDateTime = String(result.confirmedDateTime ?? target.confirmedDateTime ?? "").trim()

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
    const loadCustomers = async () => {
      const customers = await loadCustomersUseCase(company, branch)
      if (isMounted && customers.length > 0) {
        setCustomerOptions(customers)
      }
    }

    const loadItems = async () => {
      const items = await loadItemsUseCase(company, branch)
      if (isMounted && items.length > 0) {
        setItemOptions(items)
      }
    }

    const loadLocations = async () => {
      const locations = await loadLocationsUseCase(company, branch)
      if (isMounted && locations.length > 0) {
        setLocationOptions(locations)
      }
    }

    const loadPalletAddresses = async () => {
      const pallets = await loadPalletAddressesUseCase(company, branch)
      if (isMounted && pallets.length > 0) {
        setPalletOptions(pallets)
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
    let mounted = true

    const loadMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        if (!res.ok) return
        const payload = (await res.json()) as { user?: { userid?: string } }
        const userid = String(payload.user?.userid ?? "").trim()
        if (mounted && userid) setCurrentUserId(userid)
      } catch {
        // ignore
      }
    }

    void loadMe()

    return () => {
      mounted = false
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
    try {
      const customers = await loadCustomersUseCase(company, branch)
      if (customers.length > 0) {
        setCustomerOptions(customers)
      }
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
    try {
      const locations = await loadLocationsUseCase(company, branch)
      if (locations.length > 0) {
        setLocationOptions(locations)
      }
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
    try {
      const pallets = await loadPalletAddressesUseCase(company, branch)
      if (pallets.length > 0) {
        setPalletOptions(pallets)
      }
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
    void validateHeaderPallet(code)
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
      setLines((prev) => [...prev, { ...nextLine, id: createLineId() }])
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
    const normalized = errors.map((err) => String(err ?? "").trim()).filter((err) => err.length > 0)
    const finalErrors =
      normalized.length > 0
        ? normalized
        : ["Draft validation failed. Please review required fields and try again."]
    toast.error("Cannot save draft", {
      description: (
        <ul className="list-disc pl-4">
          {finalErrors.map((err, idx) => (
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

    const result = await validateLocationUseCase(company, branch, location)
    if (!result.ok || !result.valid) {
      setHeaderErrors((prev) => ({ ...prev, location: true }))
      toast.error(result.message || "Location is invalid or already occupied.")
      return
    }

    setHeaderErrors((prev) => ({ ...prev, location: false }))
  }

  const validateHeaderPallet = async (palletValue: string) => {
    if (!editable) return
    const palletId = palletValue.trim()
    if (!palletId) return

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

    const result = await validatePalletAddressUseCase(company, branch, palletId, null)
    if (!result.ok || !result.valid) {
      setHeaderErrors((prev) => ({ ...prev, palletId: true }))
      toast.error(result.message || "Pallet is invalid or already occupied.")
      return
    }

    setHeaderErrors((prev) => ({ ...prev, palletId: false }))
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
      const draftType: "receivingdraftupdate" | "receivingdraftadd" =
        hasSavedDraft ? "receivingdraftupdate" : "receivingdraftadd"
      const fullDraftPayload = {
        type: draftType,
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
          createdby: currentUserId,
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

      const validationResult = await validateReceivingDraftUseCase(company, branch, header, lines)
      if (!validationResult.ok) {
        showDraftValidationErrors([validationResult.message ?? "Failed to validate draft."])
        setIsSavingDraft(false)
        return
      }

      const serverErrors = (validationResult.errors ?? [])
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
      ;(validationResult.errors ?? []).forEach((err) => {
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

      if (!validationResult.ok || serverErrors.length > 0) {
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

      const saveResult = await saveReceivingDraftUseCase(fullDraftPayload)
      if (!saveResult.ok) {
        showDraftValidationErrors([saveResult.message ?? "Failed to save draft. Please try again."])
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


  const onDocumentSheetOpenChange = (open: boolean) => {
    setDocumentSheetOpen(open)
    if (!open) {
      closeLineForm()
      setCustomerPickerOpen(false)
      setItemPickerOpen(false)
      setLocationPickerOpen(false)
      setPalletPickerOpen(false)
    }
  }

  const onLineFormOpenChange = (open: boolean) => {
    setLineFormOpen(open)
    if (!open) {
      setEditingLineId(null)
      setLineDraft(createLine())
      setLineDraftErrors({})
    }
  }

  return {
    fieldErrorClass,
    pickerPageSize,
    header,
    setHeader,
    lines,
    setLines,
    headerErrors,
    setHeaderErrors,
    lineErrors,
    setLineErrors,
    isSavingDraft,
    setIsSavingDraft,
    lineFormOpen,
    setLineFormOpen,
    editingLineId,
    setEditingLineId,
    itemPickerOpen,
    setItemPickerOpen,
    customerPickerOpen,
    setCustomerPickerOpen,
    locationPickerOpen,
    setLocationPickerOpen,
    palletPickerOpen,
    setPalletPickerOpen,
    customerOptions,
    setCustomerOptions,
    itemOptions,
    setItemOptions,
    locationOptions,
    setLocationOptions,
    palletOptions,
    setPalletOptions,
    customerSearch,
    setCustomerSearch,
    itemSearch,
    setItemSearch,
    locationSearch,
    setLocationSearch,
    palletSearch,
    setPalletSearch,
    customerPage,
    setCustomerPage,
    itemPage,
    setItemPage,
    locationPage,
    setLocationPage,
    palletPage,
    setPalletPage,
    lineDraft,
    setLineDraft,
    lineDraftErrors,
    setLineDraftErrors,
    documentStatus,
    setDocumentStatus,
    isConfirmed,
    setIsConfirmed,
    confirmedBy,
    setConfirmedBy,
    confirmedDateTime,
    setConfirmedDateTime,
    hasSavedDraft,
    setHasSavedDraft,
    documentSheetOpen,
    setDocumentSheetOpen,
    selectedDocumentNo,
    setSelectedDocumentNo,
    documents,
    setDocuments,
    documentPage,
    setDocumentPage,
    documentPageSize,
    setDocumentPageSize,
    isLoadingDocuments,
    setIsLoadingDocuments,
    putAwayStatus,
    effectiveStatus,
    editable,
    totalQty,
    totalHeads,
    totalWeight,
    totalDocuments,
    totalDocumentPages,
    draftDocumentCount,
    confirmedDocumentCount,
    cancelledDocumentCount,
    filteredCustomers,
    filteredItems,
    filteredLocations,
    filteredPallets,
    totalCustomerPages,
    totalItemPages,
    totalLocationPages,
    totalPalletPages,
    pagedCustomers,
    pagedItems,
    pagedLocations,
    pagedPallets,
    pagedDocuments,
    putAwayDetails,
    loadReceivingDocuments,
    createDocumentNo,
    upsertDocumentFromCurrentState,
    resetDocumentEditor,
    onCreateDocument,
    onOpenDocument,
    onDocStatusChange,
    onHeaderChange,
    onOpenAddLine,
    onLineDraftChange,
    closeLineForm,
    onOpenCustomerPicker,
    onOpenLocationPicker,
    onOpenPalletPicker,
    onSelectCustomer,
    onSelectItem,
    onSelectLocation,
    onSelectPallet,
    onSaveLineDraft,
    onRemoveLine,
    onEditLine,
    onConfirm,
    onCancel,
    onSaveDraft,
    onRemoveDraft,
    onDocumentSheetOpenChange,
    onLineFormOpenChange,
  }
}

export type InboundState = ReturnType<typeof useInbound>

