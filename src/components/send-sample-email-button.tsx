"use client"

import * as React from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/src/components/ui/button"

type SendSampleEmailErrorPayload = {
  message?: unknown
  id?: unknown
  detail?: unknown
  error?: unknown
}

function toErrorDetail(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (!value || typeof value !== "object") return ""

  const objectValue = value as { message?: unknown; error?: unknown }
  if (typeof objectValue.message === "string") return objectValue.message
  if (typeof objectValue.error === "string") return objectValue.error

  try {
    return JSON.stringify(value)
  } catch {
    return "[unserializable error detail]"
  }
}

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

      const rawBody = await res.text()
      let payload: SendSampleEmailErrorPayload | null = null
      try {
        payload = rawBody ? (JSON.parse(rawBody) as SendSampleEmailErrorPayload) : null
      } catch {
        payload = null
      }

      if (!res.ok) {
        const detail = toErrorDetail(payload?.detail ?? payload?.error ?? rawBody)
        const msg =
          typeof payload?.message === "string" && payload.message
            ? payload.message
            : `Failed to send sample email (HTTP ${res.status}).`
        toast.error(detail ? `${msg}: ${detail}` : msg)
        console.error("[send-sample-email] failed", {
          status: res.status,
          payload,
          rawBody,
        })
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
