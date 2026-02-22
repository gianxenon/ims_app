import type {
  CustomerOption,
  ItemOption,
  LocationOption,
  PalletAddressOption,
} from "@/src/shared/options"
import {
  fetchCustomers,
  fetchItems,
  fetchLocations,
  fetchPalletAddresses,
} from "@/src/infrastructure/data-sources/shared/options"

// Application use-cases for shared option lists.
export async function loadCustomers(company: string, branch: string): Promise<CustomerOption[]> {
  const result = await fetchCustomers(company, branch)
  if (!result.ok) return []
  return (result.data.customers ?? []) as CustomerOption[]
}

export async function loadItems(company: string, branch: string): Promise<ItemOption[]> {
  const result = await fetchItems(company, branch)
  if (!result.ok) return []
  return (result.data.items ?? []) as ItemOption[]
}

export async function loadLocations(company: string, branch: string): Promise<LocationOption[]> {
  const result = await fetchLocations(company, branch)
  if (!result.ok) return []
  return (result.data.locations ?? []) as LocationOption[]
}

export async function loadPalletAddresses(company: string, branch: string): Promise<PalletAddressOption[]> {
  const result = await fetchPalletAddresses(company, branch)
  if (!result.ok) return []
  return (result.data.pallets ?? []) as PalletAddressOption[]
}
