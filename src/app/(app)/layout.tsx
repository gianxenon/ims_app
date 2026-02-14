import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { isSessionJwtValid } from "@/src/lib/auth/session"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const jwt = cookieStore.get("session")?.value

  if (!isSessionJwtValid(jwt)) redirect("/login")

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r p-4">IMS Sidebar</aside>
      <div className="flex-1">
        <header className="h-14 border-b px-4 flex items-center">Topbar</header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
