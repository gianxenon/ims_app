"use client"

import * as React from "react"
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
  ClipboardList,
} from "lucide-react"

import { NavMain } from "@/src/components/nav-main"
import { NavUser } from "@/src/components/nav-user"
import { TeamSwitcher } from "@/src/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/src/components/ui/sidebar"

type SidebarUser = {
  userid?: string
  name: string
  email: string
  avatar: string
}

const defaultData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  } as SidebarUser,
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
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
        {
          title: "Inventory Table",
          url: "/dashboard",
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
          url: "#",
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

  React.useEffect(() => {
    let mounted = true

    const loadMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        if (!res.ok) return

        const payload = (await res.json()) as { user?: SidebarUser }
        if (mounted && payload.user) {
          setUser((prev) => ({
            ...prev,
            ...payload.user,
            avatar: payload.user.avatar || prev.avatar,
          }))
        }
      } catch {
      }
    }

    void loadMe()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={defaultData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={defaultData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
