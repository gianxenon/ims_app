import { SiteHeader } from "@/src/components/site-header"

export default function InboundPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            <h1 className="text-xl font-semibold">Inbound</h1>
            <p className="text-muted-foreground text-sm">
              Inbound receiving workflow will be implemented here.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
