import { cookies } from "next/headers"
import { CurrentStockTable } from "@/src/components/current-stock-table"
import { RoomSectionCardsContainer } from "@/src/components/room-section-cards-container"
import { SiteHeader } from "@/src/components/site-header"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const company = cookieStore.get("active_company")?.value ?? process.env.PHP_COMPANY ?? ""
  const branch = cookieStore.get("active_branch")?.value ?? process.env.PHP_BRANCH ?? ""

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <RoomSectionCardsContainer company={company} branch={branch} />
            <section className="px-4 lg:px-6">
              <CurrentStockTable company={company} branch={branch} />
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
