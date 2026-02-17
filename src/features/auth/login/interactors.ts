import type { Dispatch } from "react"

import { checkSession, loginWithCredentials, type LoginResult } from "@/src/features/auth/login/data-source"
import type { LoginEvent } from "@/src/features/auth/login/event"

type NavigateToDashboard = () => void

type LoginSubmitInput = {
  userid: string
  password: string
}

export async function initializeLogin(
  dispatch: Dispatch<LoginEvent>,
  navigateToDashboard: NavigateToDashboard
): Promise<void> {
  dispatch({ type: "SESSION_CHECK_STARTED" })
  try {
    const authenticated = await checkSession()
    if (authenticated) {
      navigateToDashboard()
    }
  } finally {
    dispatch({ type: "SESSION_CHECK_FINISHED" })
  }
}

export async function submitLogin(
  dispatch: Dispatch<LoginEvent>,
  input: LoginSubmitInput,
  navigateToDashboard: NavigateToDashboard
): Promise<LoginResult> {
  dispatch({ type: "LOGIN_STARTED" })

  try {
    const result = await loginWithCredentials(input.userid, input.password)
    if (!result.ok) {
      dispatch({ type: "LOGIN_FAILED", message: result.message || "Login failed" })
      return result
    }

    navigateToDashboard()
    return result
  } finally {
    dispatch({ type: "LOGIN_FINISHED" })
  }
}
