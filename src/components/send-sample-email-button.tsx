"use client"

import * as React from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/src/components/ui/button"

export function SendSampleEmailButton({
  company,
  branch,
}: {
  company: string
  branch: string
}) {
  const [sending, setSending] = React.useState(false)

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await fetch("/api/email/send-pallet-utilization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ company, branch }),
      })

      const payload = (await res.json()) as { message?: string; id?: string; detail?: unknown; error?: string }
      if (!res.ok) {
        const detail =
          typeof payload.detail === "string"
            ? payload.detail
            : typeof payload.error === "string"
              ? payload.error
              : ""
        const msg = payload.message ?? "Failed to send sample email."
        toast.error(detail ? `${msg}: ${detail}` : msg)
        console.error("[send-sample-email] failed", payload)
        return
      }

      toast.success("Sample email sent successfully.")
    } catch {
      toast.error("Unable to send email right now.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Button type="button" onClick={handleSend} disabled={sending}>
      <Send className="mr-2 h-4 w-4" />
      {sending ? "Sending..." : "Send Sample Email"}
    </Button>
  )
}
