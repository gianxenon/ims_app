"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/src/components/ui/separator"
import { SidebarTrigger } from "@/src/components/ui/sidebar"
import { ThemeToggle } from "@/src/components/theme-toggle"

function toTitle(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}

function getHeaderTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Inventory Dashboard"
  if (pathname === "/orders/sales-order") return "Sales Order"
  if (pathname === "/receiving/inbound") return "Inbound"
  if (pathname === "/receiving/put-away") return "Put Away"
  if (pathname === "/receiving/history") return "Receiving History"

  const parts = pathname.split("/").filter(Boolean)
  if (parts.length === 0) return "Dashboard"
  return toTitle(parts[parts.length - 1] ?? "Dashboard")
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = getHeaderTitle(pathname ?? "")

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
