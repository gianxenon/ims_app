"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { initializeLogin, submitLogin } from "@/src/application/use-cases/auth/login"
import { initialLoginState, loginReducer } from "@/src/ui/features/auth/login/state"

// UI hook that wires login state to application use-cases.
export function useLogin() {
  const router = useRouter()
  const [state, dispatch] = React.useReducer(loginReducer, initialLoginState)

  const navigateToDashboard = React.useCallback(() => {
    router.replace("/dashboard")
    router.refresh()
  }, [router])

  React.useEffect(() => {
    // On first render, check the session and redirect if already authenticated.
    let mounted = true

    const run = async () => {
      dispatch({ type: "SESSION_CHECK_STARTED" })
      try {
        const { authenticated } = await initializeLogin()
        if (mounted && authenticated) {
          navigateToDashboard()
        }
      } finally {
        if (mounted) {
          dispatch({ type: "SESSION_CHECK_FINISHED" })
        }
      }
    }

    void run()
    return () => {
      mounted = false
    }
  }, [navigateToDashboard])

  const onUserIdChange = React.useCallback((value: string) => {
    dispatch({ type: "USERID_CHANGED", value })
  }, [])

  const onPasswordChange = React.useCallback((value: string) => {
    dispatch({ type: "PASSWORD_CHANGED", value })
  }, [])

  const onSubmit = React.useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault()

      dispatch({ type: "LOGIN_STARTED" })
      try {
        const result = await submitLogin({
          userid: state.userid,
          password: state.password,
        })

        if (!result.ok) {
          dispatch({ type: "LOGIN_FAILED", message: result.message || "Login failed" })
          toast.error(result.message || "Login failed")
          return
        }

        navigateToDashboard()
      } finally {
        dispatch({ type: "LOGIN_FINISHED" })
      }
    },
    [navigateToDashboard, state.password, state.userid]
  )


  return {
    state,
    onUserIdChange,
    onPasswordChange,
    onSubmit,
  }
}
