import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/src/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar"
import { isSessionJwtValid } from "@/src/lib/auth/session"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const jwt = cookieStore.get("session")?.value

  if (!isSessionJwtValid(jwt)) redirect("/login")

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
