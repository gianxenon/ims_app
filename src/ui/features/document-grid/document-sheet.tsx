"use client"

import type * as React from "react"

import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/src/components/ui/sheet"

export type DocumentSheetSection = {
  key?: string
  title?: string
  header?: React.ReactNode
  content: React.ReactNode
}

export type DocumentSheetActions = {
  onConfirm?: () => void
  onCancel?: () => void
  onSaveDraft?: () => void
  onRemoveDraft?: () => void
  disabled?: boolean
}

type DocumentSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  sections?: DocumentSheetSection[]
  children?: React.ReactNode
  actions?: DocumentSheetActions
}

export function DocumentSheet({
  open,
  onOpenChange,
  title,
  description,
  sections,
  children,
  actions,
}: DocumentSheetProps) {
  const hasActions =
    Boolean(actions?.onConfirm) ||
    Boolean(actions?.onCancel) ||
    Boolean(actions?.onSaveDraft) ||
    Boolean(actions?.onRemoveDraft)
  const hasSections = Boolean(sections && sections.length > 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[92vw]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {hasSections
            ? sections?.map((section, index) => (
                <Card key={section.key ?? index}>
                  {section.header ? (
                    <CardHeader>{section.header}</CardHeader>
                  ) : section.title ? (
                    <CardHeader>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                  ) : null}
                  <CardContent className={section.header || section.title ? undefined : "pt-6"}>
                    {section.content}
                  </CardContent>
                </Card>
              ))
            : children}

          {hasActions ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {actions?.onConfirm ? (
                    <Button onClick={actions.onConfirm} disabled={actions.disabled}>
                      Confirm
                    </Button>
                  ) : null}
                  {actions?.onCancel ? (
                    <Button variant="outline" onClick={actions.onCancel} disabled={actions.disabled}>
                      Cancel
                    </Button>
                  ) : null}
                  {actions?.onSaveDraft ? (
                    <Button variant="secondary" onClick={actions.onSaveDraft} disabled={actions.disabled}>
                      Save Draft
                    </Button>
                  ) : null}
                  {actions?.onRemoveDraft ? (
                    <Button variant="destructive" onClick={actions.onRemoveDraft} disabled={actions.disabled}>
                      Remove Draft
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
