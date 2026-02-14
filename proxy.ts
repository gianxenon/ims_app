import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isSessionJwtValid } from "./src/lib/auth/session"

export function proxy(req: NextRequest) {
  const session = req.cookies.get("session")?.value
  const hasValidSession = isSessionJwtValid(session)
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/login")) {
    if (hasValidSession) {
      const url = req.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    if (session && !hasValidSession) {
      const res = NextResponse.next()
      res.cookies.set("session", "", { path: "/", maxAge: 0 })
      return res
    }

    return NextResponse.next()
  }

  if (pathname.startsWith("/dashboard") && !hasValidSession) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    const res = NextResponse.redirect(url)
    if (session) {
      res.cookies.set("session", "", { path: "/", maxAge: 0 })
    }
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
