import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

export function InboundCard() {
  return (
        <Card>
              <CardHeader>
                <CardTitle>Inbound Overview</CardTitle>
                <CardDescription>Inbound documents grid header and quick totals.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Total Documents</p>
                    <p className="mt-1 text-2xl font-semibold">{0}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Draft</p>
                    <p className="mt-1 text-2xl font-semibold">{0}</p>
                  </div> 
                </div>
              </CardContent>
            </Card>
  )
}