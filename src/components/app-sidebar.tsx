"use client"

import * as React from "react"
import { GalleryVerticalEnd, Settings2, SquareTerminal, ClipboardList, PackageCheck, } from "lucide-react"
import { NavMain } from "@/src/components/nav-main"
import { NavUser } from "@/src/components/nav-user"
import { TeamSwitcher } from "@/src/components/team-switcher"
import { Skeleton } from "@/src/components/ui/skeleton"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, } from "@/src/components/ui/sidebar"

type SidebarUser = {
  userid?: string
  name: string
  email: string
  avatar: string
}

type SidebarTeam = {
  name: string
  logo: React.ElementType
  plan: string
  companyCode: string
  branchCode: string
}

const defaultData = {
  user: {
    name: "Loading...",
    email: "",
    avatar: "/next.svg",
  } as SidebarUser,
  teams: [] as SidebarTeam[],
  navMain: [
    {
      title: "Inventory Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Room Summary",
          url: "/dashboard",
        },
      ],
    },
    {
      title: "Receiving",
      url: "#",
      icon: PackageCheck,
      items: [
        {
          title: "Inbound",
          url: "/receiving/inbound",
        },
        {
          title: "Put Away",
          url: "/receiving/put-away",
        },
        {
          title: "Receiving History",
          url: "/receiving/history",
        },
      ],
    },
    {
      title: "Orders",
      url: "#",
      icon: ClipboardList,
      items: [
        {
          title: "Sales Order",
          url: "/orders/sales-order",
        },
        {
          title: "Picklist",
          url: "#",
        },
        {
          title: "Dispatch",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Branch",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<SidebarUser>(defaultData.user)
  const [teams, setTeams] = React.useState<SidebarTeam[]>(defaultData.teams)
  const [meLoading, setMeLoading] = React.useState(true)
  const [branchesLoading, setBranchesLoading] = React.useState(true)
  const teamsToRender = teams.length > 0 ? teams : []
  

  // Load user info on mount
  React.useEffect(() => {
    let mounted = true

    const loadMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        if (!res.ok) return

        const payload = (await res.json()) as { user?: SidebarUser }
        const nextUser = payload.user
        if (mounted && nextUser) {
          setUser((prev) => ({
            ...prev,
            ...nextUser,
            avatar: nextUser.avatar || prev.avatar,
          }))
        }
      } catch {
      } finally {
        if (mounted) setMeLoading(false)
      }
    }

    void loadMe()

    return () => {
      mounted = false
    }
  }, [])
  
  // Load branches on mount and when user changes
  React.useEffect(() => {
    let mounted = true

    const loadBranches = async () => {
      if (mounted) setBranchesLoading(true)

      try {
        const userid = user.userid?.trim()
        const endpoint = userid
          ? `/api/branches?userid=${encodeURIComponent(userid)}`
          : "/api/branches"

        const res = await fetch(endpoint, { cache: "no-store" })
        if (!res.ok) return

        const payload = (await res.json()) as {
          branches?: Array<{ companyCode: string; branchCode: string; branchName: string }>
        }

        const fromApi = payload.branches ?? []
        if (!mounted || fromApi.length === 0) return

        const mapped: SidebarTeam[] = fromApi.map((b) => ({
          name: b.branchName || b.branchCode,
          logo: GalleryVerticalEnd,
          plan: `${b.companyCode} | ${b.branchCode}`,
          companyCode: b.companyCode,
          branchCode: b.branchCode,
        }))

        setTeams(mapped)
      } catch {
      } finally {
        if (mounted) setBranchesLoading(false)
      }
    }

    void loadBranches()

    return () => {
      mounted = false
    }
  }, [user.userid])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {meLoading || branchesLoading ? (
          <div className="overflow-hidden px-2 py-1 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 rounded-md border p-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ) : (
          <TeamSwitcher teams={teamsToRender} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={defaultData.navMain} teams={teamsToRender} />
      </SidebarContent>
      <SidebarFooter>
        {meLoading ? (
          <div className="overflow-hidden px-2 py-1 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 rounded-md border p-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        ) : (
          <NavUser user={user} />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
