"use client"

import * as React from "react"
import { cn } from "@/src/lib/utils"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import {
  Field,
 // FieldDescription,
  FieldGroup,
  FieldLabel,
 // FieldSeparator,
} from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"
import Image from "next/image"
import { useRouter } from "next/navigation"

type LoginApiOk = { ok: true }
type LoginApiErr = { message?: string }
type LoginApiResponse = LoginApiOk | LoginApiErr

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [userid, setUserId] = React.useState<string>("")
  const [password, setPassword] = React.useState<string>("")
  const [loading, setLoading] = React.useState<boolean>(false)
  const [checkingSession, setCheckingSession] = React.useState<boolean>(true)

  React.useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" })
        const data = (await res.json()) as { authenticated?: boolean }

        if (mounted && data.authenticated) {
          router.replace("/dashboard")
          router.refresh()
          return
        }
      } catch {
      } finally {
        if (mounted) setCheckingSession(false)
      }
    }

    void checkSession()

    return () => {
      mounted = false
    }
  }, [router])

  const handleSubmit = async (
    e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>
  ) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userid, password }),
      })

      const text = await res.text()
      const data: LoginApiResponse = text ? JSON.parse(text) : { message: "" }

      if (!res.ok) {
        alert(("message" in data && data.message) || "Login failed")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Acme Inc account
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="userid">User Id</FieldLabel>
                <Input
                  id="userid"
                  type="text"
                  placeholder="gbgindoy"
                  value={userid}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>

                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <Button type="submit" disabled={loading || checkingSession}>
                  {checkingSession ? "Checking session..." : loading ? "Logging in..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>

          <div className="bg-muted relative hidden md:block min-h-105">
            <Image
              src="/next.svg"
              alt="Image"
              fill
              priority
              className="object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
