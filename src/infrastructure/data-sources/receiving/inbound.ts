// Infrastructure data source for receiving/inbound endpoints.
import { requireBranchContext } from "@/src/infrastructure/data-sources/shared/branch-context"
import { postJson, getJson } from "@/src/infrastructure/php-client"


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

export async function saveReceivingDraft(payload: {
  type: "receivingdraftadd" | "receivingdraftupdate"
  company: string
  branch: string
  header: Record<string, unknown>
  lines: Array<Record<string, unknown>>
}) {
  const ctx = requireBranchContext(payload.company, payload.branch)
  if (!ctx.ok) return { ok: false as const, message: ctx.message }

  return postJson<{ ok?: boolean; message?: string; result?: unknown }>(`/api/receiving`, {
    ...payload,
    company: ctx.company,
    branch: ctx.branch,
  })
}
