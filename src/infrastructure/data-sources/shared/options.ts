// Infrastructure data source for shared option lists (customers, items, locations, pallets).
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

function withCompanyBranch(base: string, company?: string, branch?: string) {
  const ctx = requireBranchContext(company, branch)
  if (!ctx.ok) return { ok: false as const, message: ctx.message }

  const qs = new URLSearchParams()
  qs.set("company", ctx.company)
  qs.set("branch", ctx.branch)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return { ok: true as const, url: `${base}${suffix}` }
}

export async function fetchCustomers(company?: string, branch?: string) {
  const withContext = withCompanyBranch("/api/customers", company, branch)
  if (!withContext.ok) return withContext
  return getJson<{ customers?: Array<Record<string, unknown>> }>(withContext.url)
}

export async function fetchItems(company?: string, branch?: string) {
  const withContext = withCompanyBranch("/api/items", company, branch)
  if (!withContext.ok) return withContext
  return getJson<{ items?: Array<Record<string, unknown>> }>(withContext.url)
}

export async function fetchLocations(company?: string, branch?: string) {
  const withContext = withCompanyBranch("/api/locations", company, branch)
  if (!withContext.ok) return withContext
  return getJson<{ locations?: Array<Record<string, unknown>> }>(withContext.url)
}

export async function fetchPalletAddresses(company?: string, branch?: string) {
  const withContext = withCompanyBranch("/api/pallet-addresses", company, branch)
  if (!withContext.ok) return withContext
  return getJson<{ pallets?: Array<Record<string, unknown>> }>(withContext.url)
}
