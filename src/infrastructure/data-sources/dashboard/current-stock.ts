import type { CurrentStockRow, Filters } from "@/src/application/dto/dashboard/current-stock"
import { requireBranchContext } from "@/src/infrastructure/data-sources/shared/branch-context"

// Infrastructure data source: call Next.js API for inventory rows.
function buildUrl(basePath: string, company: string, branch: string, f: Filters): string {
  const p = new URLSearchParams({
    company,
    branch,
    showdetails: f.showdetails,
    withpendings: f.withpendings,
    itemno: f.itemno,
    batch: f.batch,
    location: f.location,
    tagno: f.tagno,
    receivedtype: f.receivedtype,
    custno: f.custno,
    prd_from: f.prd_from,
    prd_to: f.prd_to,
    exp_from: f.exp_from,
    exp_to: f.exp_to,
    rec_from: f.rec_from,
    rec_to: f.rec_to,
  })
  return `${basePath}?${p.toString()}`
}

export async function fetchCurrentStock(company: string, branch: string, filters: Filters) {
  const ctx = requireBranchContext(company, branch)
  if (!ctx.ok) return { ok: false as const, message: ctx.message }

  try {
    const res = await fetch(buildUrl("/api/inventory-table", ctx.company, ctx.branch, filters), {
      cache: "no-store",
    })

    if (!res.ok) {
      // Let the UI decide how to surface retry/backoff messaging.
      return { ok: false as const, message: "Inventory fetch failed. Retrying..." }
    }

    const payload = (await res.json()) as { data?: CurrentStockRow[] }
    return { ok: true as const, rows: payload.data ?? [] }
  } catch {
    return { ok: false as const, message: "Inventory fetch failed. Retrying..." }
  }
}
