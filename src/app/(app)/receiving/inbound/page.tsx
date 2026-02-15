"use client"

import * as React from "react"
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { SiteHeader } from "@/src/components/site-header"
import { Button } from "@/src/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table"
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_VALUES,
  RECEIVING_CATEGORY_VALUES,
  RECEIVING_TYPE_LABELS,
  RECEIVING_TYPE_VALUES,
  type DocumentStatus,
} from "@/src/lib/transaction-enums"
import type {
  CustomerOption,
  InboundHeader,
  InboundLine,
  ItemOption,
  PutAwayStatus,
} from "@/src/features/receiving/inbound/types"

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
    id: crypto.randomUUID(),
    tagNo: "",
    itemNo: "",
    itemName: "",
    receivingCategory: "",
    heads: "",
    palletId: "",
    location: "",
    prdDate: "",
    expDate: "",
    quantity: "",
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

export default function InboundPage() {
  const fieldErrorClass = "border-red-500 focus-visible:ring-red-500/30"
  const [header, setHeader] = React.useState<InboundHeader>(initialHeader)
  const [lines, setLines] = React.useState<InboundLine[]>([])
  const [headerErrors, setHeaderErrors] = React.useState<HeaderErrorState>({})
  const [lineErrors, setLineErrors] = React.useState<Record<string, LineFieldErrorState>>({})
  const [isSavingDraft, setIsSavingDraft] = React.useState(false)
  const [lineFormOpen, setLineFormOpen] = React.useState(false)
  const [editingLineId, setEditingLineId] = React.useState<string | null>(null)
  const [itemPickerOpen, setItemPickerOpen] = React.useState(false)
  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false)
  const [customerOptions, setCustomerOptions] = React.useState<CustomerOption[]>([])
  const [itemOptions, setItemOptions] = React.useState<ItemOption[]>([])
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [itemSearch, setItemSearch] = React.useState("")
  const [lineDraft, setLineDraft] = React.useState<InboundLine>(createLine())
  const [documentStatus, setDocumentStatus] = React.useState<DocumentStatus>("D")
  const [isConfirmed] = React.useState<unknown>(0)
  const [hasSavedDraft, setHasSavedDraft] = React.useState(false)

  const putAwayStatus = React.useMemo(
    () => mapIsConfirmedToPutAwayStatus(isConfirmed),
    [isConfirmed]
  )
  const effectiveStatus = normalizeStatus(documentStatus, putAwayStatus)
  const editable = canEdit(documentStatus, putAwayStatus)
  const totalQty = React.useMemo(() => sumBy(lines, "quantity"), [lines])
  const totalHeads = React.useMemo(() => sumBy(lines, "heads"), [lines])
  const totalWeight = React.useMemo(() => sumBy(lines, "weight"), [lines])
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

  const putAwayDetails = React.useMemo(() => {
    if (putAwayStatus === "PUTAWAY") {
      return {
        confirmedBy: "System User",
        confirmedDate: new Date().toLocaleString(),
      }
    }

    return {
      confirmedBy: "Not yet confirmed",
      confirmedDate: "Not yet confirmed",
    }
  }, [putAwayStatus])

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

    loadCustomers()
    loadItems()

    return () => {
      isMounted = false
    }
  }, [])

  const onDocStatusChange = (value: string) => {
    const next = value as DocumentStatus
    if (putAwayStatus === "NOT_PUTAWAY" && next !== "CN") {
      setDocumentStatus("D")
      return
    }
    setDocumentStatus(next)
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
    setEditingLineId(null)
    setItemSearch("")
    setLineFormOpen(true)
  }

  const onLineDraftChange = (key: keyof InboundLine, value: string) => {
    setLineDraft((prev) => ({ ...prev, [key]: value }))
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
      setCustomerPickerOpen(true)
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
    setItemPickerOpen(false)
  }

  const onSaveLineDraft = () => {
    if (!editable) return
    const nextLine = {
      ...lineDraft,
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
    setLineDraft({ ...target })
    setEditingLineId(id)
    setLineFormOpen(true)
  }

  const onConfirm = () => {
    if (putAwayStatus === "NOT_PUTAWAY") return
    setDocumentStatus("C")
  }

  const onCancel = () => {
    if (!editable) return
    setDocumentStatus("CN")
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

  const onSaveDraft = async () => {
    if (documentStatus === "CN") return
    if (!editable) return

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
      const res = await fetch("/api/receiving-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          company,
          branch,
          lines: lines.map((line) => ({
            u_batch: header.palletId.trim(),
            u_location: header.location.trim(),
            u_tagno: line.tagNo.trim(),
          })),
        }),
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

    setDocumentStatus("D")
    setHasSavedDraft(true)
    setIsSavingDraft(false)
    toast.success(hasSavedDraft ? "Draft updated." : "Draft saved.")
  }

  const onRemoveDraft = () => {
    if (!editable) return
    setHeader(initialHeader)
    setLines([])
    setDocumentStatus("D")
    setHasSavedDraft(false)
    setHeaderErrors({})
    setLineErrors({})
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
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
                    <Input
                      id="palletId"
                      className={headerErrors.palletId ? fieldErrorClass : undefined}
                      value={header.palletId}
                      onChange={(e) => onHeaderChange("palletId", e.target.value)}
                      placeholder="PPUL000001"
                      disabled={!editable}
                    />
                  </div>
                  <div className="space-y-1 md:justify-self-start md:w-full md:max-w-105">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      className={headerErrors.location ? fieldErrorClass : undefined}
                      value={header.location}
                      onChange={(e) => onHeaderChange("location", e.target.value)}
                      placeholder="RM1-01L-1A"
                      disabled={!editable}
                    />
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">#</TableHead>
                        <TableHead>Tag No</TableHead>
                        <TableHead>Item No</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Receiving Category</TableHead>
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
                            <Input
                              className={lineErrors[line.id]?.tagNo ? fieldErrorClass : undefined}
                              value={line.tagNo}
                              readOnly
                              disabled
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.itemNo}
                              readOnly
                              disabled
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.itemName}
                              readOnly
                              disabled
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.receivingCategory}
                              placeholder="Receiving category"
                              readOnly
                              disabled
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={line.prdDate}
                              readOnly
                              disabled
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={line.expDate}
                              readOnly
                              disabled
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="text-right"
                              value={line.quantity}
                              readOnly
                              disabled
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="text-right"
                              value={line.heads}
                              readOnly
                              disabled
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="text-right"
                              value={line.weight}
                              readOnly
                              disabled
                            />
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
                        <Input value={lineDraft.itemNo} readOnly placeholder="Select item" />
                        <Button
                          variant="outline"
                          size="icon-sm"
                          type="button"
                          aria-label="Select item"
                          title="Select item"
                          onClick={() => setItemPickerOpen(true)}
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
                        <SelectTrigger>
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
                        type="date"
                        value={lineDraft.prdDate}
                        onChange={(e) => onLineDraftChange("prdDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>EXP</Label>
                      <Input
                        type="date"
                        value={lineDraft.expDate}
                        onChange={(e) => onLineDraftChange("expDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        value={lineDraft.quantity}
                        onChange={(e) => onLineDraftChange("quantity", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Heads/Packs</Label>
                      <Input
                        type="number"
                        value={lineDraft.heads}
                        onChange={(e) => onLineDraftChange("heads", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label>Weight</Label>
                      <Input
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
                            onChange={(e) => setItemSearch(e.target.value)}
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
                          filteredItems.map((item) => (
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
                        onChange={(e) => setCustomerSearch(e.target.value)}
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
                      filteredCustomers.map((customer) => (
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
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
