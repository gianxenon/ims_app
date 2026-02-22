"use client"

import * as React from "react" 

import { SiteHeader } from "@/src/components/site-header"   
import { InboundCard } from "@/src/ui/features/receiving/inbound-card"
 
export default function InboundPage() { 

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            <InboundCard />
            <>
                { /* <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <CardTitle>Inbound Documents</CardTitle>
                            <CardDescription>
                            Click any row or document number to open the document details sheet.
                            </CardDescription>
                        </div>
                            onClick={onCreateDocument}  
                        <Button type="button" size="sm" >  
                            <Plus className="size-4" />
                            New Document
                        </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-130 overflow-auto rounded-lg border">
                        <Table className="min-w-245">
                            <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-48">Document No</TableHead>
                                <TableHead className="min-w-56">Customer</TableHead>
                                <TableHead className="min-w-36">Receiving Type</TableHead>
                                <TableHead className="min-w-32">Status</TableHead>
                                <TableHead className="text-right">Lines</TableHead>
                                <TableHead className="text-right">Total Qty</TableHead>
                                <TableHead className="text-right">Total Heads</TableHead>
                                <TableHead className="text-right">Total Weight</TableHead>
                                <TableHead className="min-w-56">Updated At</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody> 
                                <TableRow>
                                <TableCell className="font-medium">-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell>-</TableCell>
                                <TableCell className="text-right">-</TableCell>
                                <TableCell className="text-right">-</TableCell>
                                <TableCell className="text-right">-</TableCell>
                                <TableCell className="text-right">-</TableCell>
                                <TableCell  >-</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        </div>
                    
                    </CardContent>
                    </Card>
                    */ }
            </>
           
          </div>
        </div>
      </div>
    </>
  )
}
