// Infrastructure data source for receiving/inbound endpoints.
import { requireBranchContext } from "@/src/infrastructure/data-sources/shared/branch-context"

type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string }

async function getJson<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { cache: "no-store" })
    const data = (await res.json()) as T
    if (!res.ok) {
      const message = (data as { message?: string })?.message ?? "Request failed"
      return { ok: false, message }
    }
    return { ok: true, data }
  } catch {
    return { ok: false, message: "Request failed" }
  }
}

async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(body),
    })
    const data = (await res.json()) as T
    if (!res.ok) {
      const message = (data as { message?: string })?.message ?? "Request failed"
      return { ok: false, message }
    }
    return { ok: true, data }
  } catch {
    return { ok: false, message: "Request failed" }
  }
}

export async function fetchReceivingDocuments(company?: string, branch?: string) {
  const ctx = requireBranchContext(company, branch)
  if (!ctx.ok) return { ok: false as const, message: ctx.message }

  const qs = new URLSearchParams()
  qs.set("company", ctx.company)
  qs.set("branch", ctx.branch)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return getJson<{ documents?: Array<Record<string, unknown>> }>(`/api/receiving${suffix}`)
}

export async function fetchReceivingDocumentLines(company: string, branch: string, documentNo: string) {
  const ctx = requireBranchContext(company, branch)
  if (!ctx.ok) return { ok: false as const, message: ctx.message }

  const qs = new URLSearchParams({ documentNo })
  qs.set("company", ctx.company)
  qs.set("branch", ctx.branch)
  return getJson<{
    status?: string
    isConfirmed?: unknown
    confirmedBy?: string
    confirmedDateTime?: string
    lines?: Array<Record<string, unknown>>
  }>(`/api/receiving?${qs.toString()}`)
}

export async function fetchCustomers(company?: string, branch?: string) {
  const ctx = requireBranchContext(company, branch)
  if (!ctx.ok) return { ok: false as const, message: ctx.message }

  const qs = new URLSearchParams()
  qs.set("company", ctx.company)
  qs.set("branch", ctx.branch)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return getJson<{ customers?: Array<Record<string, unknown>> }>(`/api/customers${suffix}`)
}

export async function fetchItems(company?: string, branch?: string) {
  const ctx = requireBranchContext(company, branch)
  if (!ctx.ok) return { ok: false as const, message: ctx.message }

  const qs = new URLSearchParams()
  qs.set("company", ctx.company)
  qs.set("branch", ctx.branch)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return getJson<{ items?: Array<Record<string, unknown>> }>(`/api/items${suffix}`)
}

export async function fetchLocations(company?: string, branch?: string) {
  const ctx = requireBranchContext(company, branch)
  if (!ctx.ok) return { ok: false as const, message: ctx.message }

  const qs = new URLSearchParams()
  qs.set("company", ctx.company)
  qs.set("branch", ctx.branch)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return getJson<{ locations?: Array<Record<string, unknown>> }>(`/api/locations${suffix}`)
}

export async function fetchPalletAddresses(company?: string, branch?: string) {
  const ctx = requireBranchContext(company, branch)
  if (!ctx.ok) return { ok: false as const, message: ctx.message }

  const qs = new URLSearchParams()
  qs.set("company", ctx.company)
  qs.set("branch", ctx.branch)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return getJson<{ pallets?: Array<Record<string, unknown>> }>(`/api/pallet-addresses${suffix}`)
}

export async function validateLocation(company: string, branch: string, location: string) {
  const ctx = requireBranchContext(company, branch)
  if (!ctx.ok) return { ok: false as const, message: ctx.message }

  return postJson<{ valid?: boolean; message?: string }>(`/api/location-validate`, {
    company: ctx.company,
    branch: ctx.branch,
    location,
  })
}

export async function validateReceivingDraft(payload: {
  company: string
  branch: string
  lines: Array<{ u_batch: string; u_location: string; u_tagno: string }>
}) {
  const ctx = requireBranchContext(payload.company, payload.branch)
  if (!ctx.ok) return { ok: false as const, message: ctx.message }

  return postJson<{
    ok?: boolean
    message?: string
    errors?: Array<{ lineNo?: number | string; field?: string; code?: string; message?: string }>
  }>(`/api/receiving-validate`, {
    ...payload,
    company: ctx.company,
    branch: ctx.branch,
  })
}
