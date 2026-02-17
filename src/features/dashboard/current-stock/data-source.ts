import type { CurrentStockRow, Filters } from "./types"

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
  try {
    const res = await fetch(buildUrl("/api/inventory-table", company, branch, filters), {
      cache: "no-store",
    })

    if (!res.ok) {
      return { ok: false as const, message: "Inventory fetch failed. Retrying..." }
    }

    const payload = (await res.json()) as { data?: CurrentStockRow[] }
    return { ok: true as const, rows: payload.data ?? [] }
  } catch {
    return { ok: false as const, message: "Inventory fetch failed. Retrying..." }
  }
}
