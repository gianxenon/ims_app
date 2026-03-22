"use client"

import * as React from "react"
import { toast } from "sonner"

import type { DocumentStatus } from "@/src/shared/transaction-enums"
import type {
  CustomerOption,
  ItemOption,
  SalesOrderHeader,
  SalesOrderLine,
} from "@/src/domain/orders/sales-order"
import type { SalesOrderDocumentRecord } from "@/src/application/dto/orders/sales-order"
import { fetchCustomers, fetchItems } from "@/src/infrastructure/data-sources/shared/options"

type HeaderErrorState = Partial<Record<"customerNo" | "customerName", boolean>>
type LineDraftErrorState = Partial<Record<"itemNo" | "quantity" | "heads" | "weight", boolean>>

const initialHeader: SalesOrderHeader = {
  documentNo: "",
  customerNo: "",
  customerName: "",
  customerGroup: "",
  remarks: "",
}

const createLine = (): SalesOrderLine => ({
  id: "",
  itemNo: "",
  itemName: "",
  quantity: "1",
  heads: "",
  weight: "",
})

const createLineId = () =>
  globalThis.crypto?.randomUUID?.() ?? `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`

const sumBy = (lines: SalesOrderLine[], key: "quantity" | "heads" | "weight") =>
  lines.reduce((acc, line) => acc + (Number(line[key]) || 0), 0)

export function useSalesOrder() {
  const fieldErrorClass = "border-red-500 focus-visible:ring-red-500/30"
  const pickerPageSize = 10

  const [header, setHeader] = React.useState<SalesOrderHeader>(initialHeader)
  const [lines, setLines] = React.useState<SalesOrderLine[]>([])

  const [headerErrors, setHeaderErrors] = React.useState<HeaderErrorState>({})
  const [isSavingDraft, setIsSavingDraft] = React.useState(false)

  const [lineFormOpen, setLineFormOpen] = React.useState(false)
  const [editingLineId, setEditingLineId] = React.useState<string | null>(null)
  const [lineDraft, setLineDraft] = React.useState<SalesOrderLine>(createLine())
  const [lineDraftErrors, setLineDraftErrors] = React.useState<LineDraftErrorState>({})

  const [documentStatus, setDocumentStatus] = React.useState<DocumentStatus>("D")
  const [hasSavedDraft, setHasSavedDraft] = React.useState(false)

  const [documentSheetOpen, setDocumentSheetOpen] = React.useState(false)
  const [selectedDocumentNo, setSelectedDocumentNo] = React.useState<string | null>(null)
  const [documents, setDocuments] = React.useState<SalesOrderDocumentRecord[]>([])
  const [documentPage, setDocumentPage] = React.useState(1)
  const [documentPageSize, setDocumentPageSize] = React.useState(10)
  const [isLoadingDocuments, setIsLoadingDocuments] = React.useState(false)

  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false)
  const [itemPickerOpen, setItemPickerOpen] = React.useState(false)

  const [customerOptions, setCustomerOptions] = React.useState<CustomerOption[]>([])
  const [itemOptions, setItemOptions] = React.useState<ItemOption[]>([])
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [itemSearch, setItemSearch] = React.useState("")
  const [customerPage, setCustomerPage] = React.useState(1)
  const [itemPage, setItemPage] = React.useState(1)

  const editable = documentStatus === "D"

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
      c.groupName.toLowerCase().includes(q) ||
      c.customerGroup.toLowerCase().includes(q)
    )
  }, [customerOptions, customerSearch])

  const filteredItems = React.useMemo(() => {
    const q = itemSearch.trim().toLowerCase()
    if (!q) return itemOptions
    return itemOptions.filter((i) =>
      i.itemNo.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q)
    )
  }, [itemOptions, itemSearch])

  const totalCustomerPages = Math.max(1, Math.ceil(filteredCustomers.length / pickerPageSize))
  const totalItemPages = Math.max(1, Math.ceil(filteredItems.length / pickerPageSize))

  const pagedCustomers = React.useMemo(() => {
    const start = (customerPage - 1) * pickerPageSize
    return filteredCustomers.slice(start, start + pickerPageSize)
  }, [filteredCustomers, customerPage, pickerPageSize])

  const pagedItems = React.useMemo(() => {
    const start = (itemPage - 1) * pickerPageSize
    return filteredItems.slice(start, start + pickerPageSize)
  }, [filteredItems, itemPage, pickerPageSize])

  const pagedDocuments = React.useMemo(() => {
    const start = (documentPage - 1) * documentPageSize
    return documents.slice(start, start + documentPageSize)
  }, [documents, documentPage, documentPageSize])

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

  React.useEffect(() => {
    let isMounted = true
    const { company, branch } = getCompanyBranch()

    const loadCustomers = async () => {
      const result = await fetchCustomers(company, branch)
      if (!result.ok) return
      const customers = (result.data.customers ?? []) as CustomerOption[]
      if (isMounted) setCustomerOptions(customers)
    }

    const loadItems = async () => {
      const result = await fetchItems(company, branch)
      if (!result.ok) return
      const items = (result.data.items ?? []) as ItemOption[]
      if (isMounted) setItemOptions(items)
    }

    void loadCustomers()
    void loadItems()

    return () => {
      isMounted = false
    }
  }, [getCompanyBranch])

  React.useEffect(() => {
    setCustomerPage((prev) => Math.min(prev, totalCustomerPages))
  }, [totalCustomerPages])

  React.useEffect(() => {
    setItemPage((prev) => Math.min(prev, totalItemPages))
  }, [totalItemPages])

  React.useEffect(() => {
    setDocumentPage((prev) => Math.min(prev, totalDocumentPages))
  }, [totalDocumentPages])

  const createDocumentNo = React.useCallback(() => {
    const year = new Date().getFullYear()
    const used = new Set(documents.map((doc) => doc.documentNo))
    let sequence = documents.length + 1
    let candidate = `SO-${year}-${String(sequence).padStart(6, "0")}`
    while (used.has(candidate)) {
      sequence += 1
      candidate = `SO-${year}-${String(sequence).padStart(6, "0")}`
    }
    return candidate
  }, [documents])

  const resetDocumentEditor = React.useCallback(
    (documentNo = "") => {
      setHeader({ ...initialHeader, documentNo })
      setLines([])
      setDocumentStatus("D")
      setHasSavedDraft(false)
      setHeaderErrors({})
      setLineFormOpen(false)
      setEditingLineId(null)
      setLineDraft(createLine())
      setLineDraftErrors({})
    },
    []
  )

  const upsertDocumentFromCurrentState = (
    documentNo: string,
    nextStatus: DocumentStatus,
    nextHasSavedDraft: boolean
  ) => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ")
    const record: SalesOrderDocumentRecord = {
      documentNo,
      status: nextStatus,
      updatedAt: now,
      lineCount: lines.length,
      header: { ...header, documentNo },
      lines: lines.map((line) => ({ ...line })),
      totalQty,
      totalHeads,
      totalWeight,
    }

    setDocuments((prev) => {
      const index = prev.findIndex((doc) => doc.documentNo === documentNo)
      if (index === -1) return [record, ...prev]
      const next = [...prev]
      next[index] = record
      return next
    })
    setHasSavedDraft(nextHasSavedDraft)
    setDocumentPage(1)
  }

  const onCreateDocument = () => {
    const nextDocumentNo = createDocumentNo()
    resetDocumentEditor(nextDocumentNo)
    setSelectedDocumentNo(nextDocumentNo)
    setDocumentSheetOpen(true)
  }

  const onOpenDocument = (documentNo: string) => {
    const target = documents.find((doc) => doc.documentNo === documentNo)
    if (!target) return
    setHeader({ ...target.header })
    setLines(target.lines.map((line) => ({ ...line })))
    setDocumentStatus(target.status)
    setHasSavedDraft(target.status === "D")
    setHeaderErrors({})
    setLineFormOpen(false)
    setEditingLineId(null)
    setLineDraft(createLine())
    setLineDraftErrors({})
    setSelectedDocumentNo(target.documentNo)
    setDocumentSheetOpen(true)
  }

  const onDocStatusChange = (value: string) => {
    const next = value as DocumentStatus
    setDocumentStatus(next)
    const currentDocumentNo = header.documentNo.trim()
    if (currentDocumentNo) {
      upsertDocumentFromCurrentState(currentDocumentNo, next, hasSavedDraft)
    }
  }

  const onHeaderChange = (key: keyof SalesOrderHeader, value: string) => {
    if (!editable) return
    setHeader((prev) => ({ ...prev, [key]: value }))
    if (key === "customerNo" || key === "customerName") {
      setHeaderErrors((prev) => ({ ...prev, [key]: false }))
    }
  }

  const onOpenCustomerPicker = () => {
    if (!editable) return
    setCustomerSearch("")
    setCustomerPage(1)
    setCustomerPickerOpen(true)
  }

  const onSelectCustomer = (customerNo: string, customerName: string, customerGroup: string) => {
    if (!editable) return
    setHeader((prev) => ({
      ...prev,
      customerNo,
      customerName,
      customerGroup,
    }))
    setHeaderErrors((prev) => ({ ...prev, customerNo: false, customerName: false }))
    setCustomerPickerOpen(false)
  }

  const onOpenAddLine = () => {
    if (!editable) return
    setLineDraft(createLine())
    setLineDraftErrors({})
    setEditingLineId(null)
    setLineFormOpen(true)
  }

  const onEditLine = (id: string) => {
    if (!editable) return
    const target = lines.find((line) => line.id === id)
    if (!target) return
    setLineDraft({ ...target })
    setLineDraftErrors({})
    setEditingLineId(id)
    setLineFormOpen(true)
  }

  const onRemoveLine = (id: string) => {
    if (!editable) return
    setLines((prev) => prev.filter((line) => line.id !== id))
  }

  const onLineDraftChange = (key: keyof SalesOrderLine, value: string) => {
    setLineDraft((prev) => ({ ...prev, [key]: value }))
    if (key in lineDraftErrors) {
      setLineDraftErrors((prev) => ({ ...prev, [key]: false }))
    }
  }

  const validateLineDraft = () => {
    const fields: LineDraftErrorState = {}
    const issues: string[] = []
    if (!lineDraft.itemNo.trim()) {
      fields.itemNo = true
      issues.push("Item No is required.")
    }
    const qty = Number(lineDraft.quantity)
    if (!Number.isFinite(qty) || qty <= 0) {
      fields.quantity = true
      issues.push("Quantity must be greater than 0.")
    }
    const heads = Number(lineDraft.heads)
    if (!Number.isFinite(heads) || heads <= 0) {
      fields.heads = true
      issues.push("Heads/Packs must be greater than 0.")
    }
    const weight = Number(lineDraft.weight)
    if (!Number.isFinite(weight) || weight <= 0) {
      fields.weight = true
      issues.push("Weight must be greater than 0.")
    }
    return { fields, issues }
  }

  const onSaveLineDraft = () => {
    if (!editable) return
    const validation = validateLineDraft()
    if (validation.issues.length > 0) {
      setLineDraftErrors(validation.fields)
      toast.error("Cannot save line item.")
      return
    }

    const nextLine = { ...lineDraft }
    if (editingLineId) {
      setLines((prev) =>
        prev.map((line) => (line.id === editingLineId ? { ...nextLine, id: editingLineId } : line))
      )
    } else {
      setLines((prev) => [...prev, { ...nextLine, id: createLineId() }])
    }
    closeLineForm()
  }

  const closeLineForm = () => {
    setLineFormOpen(false)
    setEditingLineId(null)
    setLineDraft(createLine())
    setLineDraftErrors({})
    setItemPickerOpen(false)
  }

  const onSaveDraft = () => {
    if (!editable) return
    const issues: string[] = []
    const nextErrors: HeaderErrorState = {}

    if (!header.customerNo.trim()) {
      issues.push("Customer No is required.")
      nextErrors.customerNo = true
      nextErrors.customerName = true
    }
    if (lines.length === 0) {
      issues.push("At least one line item is required.")
    }

    if (issues.length > 0) {
      setHeaderErrors(nextErrors)
      toast.error("Cannot save draft.")
      return
    }

    const currentDocumentNo = header.documentNo.trim()
    if (!currentDocumentNo) return

    setIsSavingDraft(true)
    const nextStatus: DocumentStatus = "D"
    setDocumentStatus(nextStatus)
    upsertDocumentFromCurrentState(currentDocumentNo, nextStatus, true)
    setIsSavingDraft(false)
  }

  const onConfirm = () => {
    if (!editable) return
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

  const onRemoveDraft = () => {
    if (!editable) return
    const currentDocumentNo = header.documentNo.trim()
    if (!currentDocumentNo) return
    setDocuments((prev) => prev.filter((doc) => doc.documentNo !== currentDocumentNo))
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
    customerOptions,
    setCustomerOptions,
    itemOptions,
    setItemOptions,
    customerSearch,
    setCustomerSearch,
    itemSearch,
    setItemSearch,
    customerPage,
    setCustomerPage,
    itemPage,
    setItemPage,
    lineDraft,
    setLineDraft,
    lineDraftErrors,
    setLineDraftErrors,
    documentStatus,
    setDocumentStatus,
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
    totalCustomerPages,
    totalItemPages,
    pagedCustomers,
    pagedItems,
    pagedDocuments,
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
    onSelectCustomer,
    onSelectItem: (itemNo: string, itemName: string) => {
      if (!editable) return
      setLineDraft((prev) => ({ ...prev, itemNo, itemName }))
      setLineDraftErrors((prev) => ({ ...prev, itemNo: false }))
      setItemPickerOpen(false)
    },
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

export type SalesOrderState = ReturnType<typeof useSalesOrder>
