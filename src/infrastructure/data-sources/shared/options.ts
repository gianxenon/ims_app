// Infrastructure data source for shared option lists (customers, items, locations, pallets).
import { requireBranchContext } from "@/src/infrastructure/data-sources/shared/branch-context"
 import { postJson ,getJson } from "@/src/infrastructure/php-client"
 
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

export async function validateLocation(company: string, branch: string, location: string) {
  const ctx = requireBranchContext(company, branch)
  if (!ctx.ok) return { ok: false as const, message: ctx.message }

  return postJson<{ valid?: boolean; message?: string }>(`/api/location-validate`, {
    company: ctx.company,
    branch: ctx.branch,
    location,
  })
}
