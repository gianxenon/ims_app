"use client"

import * as React from "react"

export function GlobalServerBanner() {
  const [message, setMessage] = React.useState("")

  const checkServer = React.useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setMessage("No internet connection.")
      return
    }

    try {
      const res = await fetch("/api/health", { cache: "no-store" })
      if (!res.ok) {
        setMessage("Server disconnected. Retrying...")
        return
      }
      setMessage("")
    } catch {
      setMessage("Server disconnected. Retrying...")
    }
  }, [])

  React.useEffect(() => {
    void checkServer()

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void checkServer()
      }
    }, 10000)

    const onOnline = () => void checkServer()
    const onOffline = () => setMessage("No internet connection.")

    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [checkServer])

  if (!message) return null

  return (
    <div className="border-b border-amber-500/30 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 lg:px-6">
      {message}
    </div>
  )
}
