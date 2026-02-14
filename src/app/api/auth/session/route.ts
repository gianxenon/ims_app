import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { isSessionJwtValid } from "@/src/lib/auth/session"

export async function GET() {
  const cookieStore = await cookies()
  const jwt = cookieStore.get("session")?.value
  const valid = isSessionJwtValid(jwt)

  if (!valid && jwt) {
    const res = NextResponse.json({ authenticated: false })
    res.cookies.set("session", "", { path: "/", maxAge: 0 })
    return res
  }

  return NextResponse.json({ authenticated: valid })
}
