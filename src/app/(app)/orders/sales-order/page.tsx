import { SiteHeader } from "@/src/components/site-header";

export default function SalesOrderPage() {
  return (
  <>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* <Rom rooms={rooms} />
              <section className="px-4 lg:px-6">
                <CurrentStockTable company={company} branch={branch} />
              </section> */}
            </div>
          </div>
        </div>
      </>
  )
}
