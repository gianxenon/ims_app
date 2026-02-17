"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { initializeLogin, submitLogin } from "@/src/features/auth/login/interactors"
import { initialLoginState, loginReducer } from "@/src/features/auth/login/state"

export function useLogin() {
  const router = useRouter()
  const [state, dispatch] = React.useReducer(loginReducer, initialLoginState)

  const navigateToDashboard = React.useCallback(() => {
    router.replace("/dashboard")
    router.refresh()
  }, [router])

  React.useEffect(() => {
    void initializeLogin(dispatch, navigateToDashboard)
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

      const result = await submitLogin(
        dispatch,
        {
          userid: state.userid,
          password: state.password,
        },
        navigateToDashboard
      )
      console.log("Login result:", result)
      if (!result.ok) {
        toast.error(result.message || "Login failed")
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
