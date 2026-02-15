"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/src/components/ui/sidebar"

type TeamItem = {
  name: string
  logo: React.ElementType
  plan: string
  companyCode: string
  branchCode: string
}


const ACTIVE_COMPANY_KEY = "active_company"
const ACTIVE_BRANCH_KEY = "active_branch"

function normalizeCode(value: string): string {
  return value.trim().toUpperCase()
}

function readCookieValue(key: string): string {
  const pair = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${key}=`))

  if (!pair) return ""
  return decodeURIComponent(pair.slice(key.length + 1))
}

function persistSelection(companyCode: string, branchCode: string) {
  const company = companyCode.trim()
  const branch = branchCode.trim()
  document.cookie = `${ACTIVE_COMPANY_KEY}=${encodeURIComponent(company)}; path=/; max-age=31536000; samesite=lax`
  document.cookie = `${ACTIVE_BRANCH_KEY}=${encodeURIComponent(branch)}; path=/; max-age=31536000; samesite=lax`
  try {
    window.localStorage.setItem(ACTIVE_COMPANY_KEY, company)
    window.localStorage.setItem(ACTIVE_BRANCH_KEY, branch)
  } catch {
  }
}

export function TeamSwitcher({ teams }: { teams: TeamItem[] }) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [activeTeam, setActiveTeam] = React.useState<TeamItem | undefined>(teams[0])
  const [isSwitching, setIsSwitching] = React.useState(false)
  const switchCounterRef = React.useRef(0)

  const waitForBranchResponse = React.useCallback(async (team: TeamItem) => {
    const startedAt = Date.now()
    const maxWaitMs = 20000

    while (Date.now() - startedAt < maxWaitMs) {
      try {
        const res = await fetch(
          `/api/rooms?company=${encodeURIComponent(team.companyCode)}&branch=${encodeURIComponent(team.branchCode)}`,
          { cache: "no-store" }
        )

        if (res.ok) {
          const payload = (await res.json()) as { rooms?: unknown[] }
          if (Array.isArray(payload.rooms)) {
            return
          }
        }
      } catch {
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }, [])

  const applyActiveTeam = React.useCallback(
    (team: TeamItem, opts?: { refresh?: boolean; persist?: boolean }) => {
      const refresh = opts?.refresh ?? false
      const persist = opts?.persist ?? false
      setActiveTeam(team)
      if (persist) {
        persistSelection(team.companyCode, team.branchCode)
      }
      if (refresh) {
        const switchId = ++switchCounterRef.current
        setIsSwitching(true)
        router.refresh()
        void (async () => {
          await waitForBranchResponse(team)
          if (switchCounterRef.current === switchId) {
            setIsSwitching(false)
          }
        })()
      }
    },
    [router, waitForBranchResponse]
  )

  React.useEffect(() => {
    if (teams.length === 0) {
      setActiveTeam(undefined)
      return
    }

    let savedCompany = ""
    let savedBranch = ""
    try {
      savedCompany = window.localStorage.getItem(ACTIVE_COMPANY_KEY) ?? ""
      savedBranch = window.localStorage.getItem(ACTIVE_BRANCH_KEY) ?? ""
    } catch {
    }
    if (!savedCompany) savedCompany = readCookieValue(ACTIVE_COMPANY_KEY)
    if (!savedBranch) savedBranch = readCookieValue(ACTIVE_BRANCH_KEY)

    const matched = teams.find(
      (t) =>
        normalizeCode(t.companyCode) === normalizeCode(savedCompany) &&
        normalizeCode(t.branchCode) === normalizeCode(savedBranch)
    )

    applyActiveTeam(matched ?? teams[0], { refresh: false, persist: false })
  }, [teams, applyActiveTeam])

  if (!activeTeam) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">No branches</span>
              <span className="truncate text-xs">Please check getbranches response</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <>
      {isSwitching && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-[1px]">
          <div className="flex h-full items-center justify-center px-6">
            <div className="rounded-lg border bg-card px-5 py-3 text-sm font-medium text-card-foreground shadow-sm">
              Switching branch, please wait...
            </div>
          </div>
        </div>
      )}

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <activeTeam.logo className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeTeam.name}</span>
                  <span className="truncate text-xs">{activeTeam.plan}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Branches
              </DropdownMenuLabel>
              {teams.map((team, index) => (
                <DropdownMenuItem
                  key={`${team.companyCode}-${team.branchCode}`}
                  onClick={() => applyActiveTeam(team, { refresh: true, persist: true })}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <team.logo className="size-3.5 shrink-0" />
                  </div>
                  {team.name}
                  <DropdownMenuShortcut>{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2" disabled>
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Branch list</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}
