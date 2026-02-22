"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ACTIVE_BRANCH_EVENT,
  type ActiveBranchSelection,
  persistActiveSelection,
  readActiveSelection,
} from "@/src/shared/active-branch"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/src/components/ui/sidebar"

export function NavMain({
  items,
  teams,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
  teams: {
    name: string
    companyCode: string
    branchCode: string
  }[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [hasMounted, setHasMounted] = React.useState(false)
  const [selection, setSelection] = React.useState<ActiveBranchSelection | null>(null)
  const [isBranchModalOpen, setIsBranchModalOpen] = React.useState(false)
  const [pendingUrl, setPendingUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    setHasMounted(true)
    const nextSelection = readActiveSelection()
    setSelection(nextSelection)
    if (!nextSelection && teams.length > 0) {
      setIsBranchModalOpen(true)
    }
  }, [teams])

  React.useEffect(() => {
    const onBranchChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ companyCode?: string; branchCode?: string }>
      const companyCode = customEvent.detail?.companyCode?.trim()
      const branchCode = customEvent.detail?.branchCode?.trim()

      if (companyCode && branchCode) {
        setSelection({ companyCode, branchCode })
        setIsBranchModalOpen(false)
      } else {
        setSelection(readActiveSelection())
      }
    }

    window.addEventListener(ACTIVE_BRANCH_EVENT, onBranchChanged as EventListener)
    return () => {
      window.removeEventListener(ACTIVE_BRANCH_EVENT, onBranchChanged as EventListener)
    }
  }, [])

  const isPathActive = (url: string): boolean => {
    if (!url || url === "#") return false
    if (pathname === url) return true
    return pathname.startsWith(`${url}/`)
  }

  const buildBranchedUrl = React.useCallback(
    (baseUrl: string, companyCode?: string, branchCode?: string): string => {
      if (!baseUrl || baseUrl === "#") return baseUrl

      const company = companyCode?.trim() ?? selection?.companyCode?.trim() ?? ""
      const branch = branchCode?.trim() ?? selection?.branchCode?.trim() ?? ""
      if (!company || !branch) return baseUrl

      const [pathOnly, hash = ""] = baseUrl.split("#", 2)
      const [pathnameOnly, queryString = ""] = pathOnly.split("?", 2)
      const params = new URLSearchParams(queryString)
      params.set("company", company)
      params.set("branch", branch)
      const query = params.toString()

      return `${pathnameOnly}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`
    },
    [selection]
  )

  const requireSelection = React.useCallback(
    (targetUrl: string): boolean => {
      if (!targetUrl || targetUrl === "#") return false
      if (selection?.companyCode && selection?.branchCode) return false

      setPendingUrl(targetUrl)
      setIsBranchModalOpen(true)
      return true
    },
    [selection]
  )

  const handleBranchSelect = React.useCallback(
    (companyCode: string, branchCode: string) => {
      persistActiveSelection(companyCode, branchCode)
      setSelection({ companyCode, branchCode })
      setIsBranchModalOpen(false)

      if (pendingUrl) {
        router.push(buildBranchedUrl(pendingUrl, companyCode, branchCode))
        setPendingUrl(null)
        return
      }

      router.refresh()
    },
    [buildBranchedUrl, pendingUrl, router]
  )

  return (
    <>
      {hasMounted && isBranchModalOpen && teams.length > 0 && (
        <div className="fixed inset-0 z-50 bg-background/70">
          <div className="flex h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-lg">
              <h2 className="text-lg font-semibold text-card-foreground">Select Branch First</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a branch to continue. Routes are locked until a branch is selected.
              </p>
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                {teams.map((team) => (
                  <button
                    key={`${team.companyCode}-${team.branchCode}`}
                    type="button"
                    onClick={() => handleBranchSelect(team.companyCode, team.branchCode)}
                    className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <div className="font-medium">{team.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {team.companyCode} | {team.branchCode}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => {
            const childActive = item.items?.some((subItem) => isPathActive(subItem.url)) ?? false
            const itemActive = isPathActive(item.url) || childActive

            return (
              <Collapsible
                key={`${item.title}-${pathname}`}
                asChild
                defaultOpen={item.isActive || itemActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={itemActive}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const subActive = isPathActive(subItem.url)
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={subActive}
                              className={subActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}
                            >
                              <Link
                                href={buildBranchedUrl(subItem.url)}
                                onClick={(event) => {
                                  if (requireSelection(subItem.url)) {
                                    event.preventDefault()
                                  }
                                }}
                              >
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}
