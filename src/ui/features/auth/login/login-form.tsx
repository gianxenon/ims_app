"use client"

import * as React from "react"
import Image from "next/image"

import { useLogin } from "@/src/ui/features/auth/login/use-login"
import { cn } from "@/src/shared/utils"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { state, onUserIdChange, onPasswordChange, onSubmit } = useLogin()

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={onSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your account
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="userid">User Id</FieldLabel>
                <Input
                  id="userid"
                  type="text"
                  placeholder="User Id"
                  value={state.userid}
                  onChange={(e) => onUserIdChange(e.target.value)}
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
                  placeholder="Password"
                  value={state.password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  required
                />
              </Field>

              {state.error && (
                <p className="text-destructive text-sm">{state.error}</p>
              )}

              <Field>
                <Button type="submit" disabled={state.loading || state.checkingSession}>
                  {state.checkingSession ? "Checking session..." : state.loading ? "Logging in..." : "Login"}
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
