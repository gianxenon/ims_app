import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { isSessionJwtValid } from "@/src/lib/auth/session"

type PhpProfileUser = {
  userid?: string
  name?: string
  email?: string
  token?: string
}

type PhpProfileResponse = {
  user?: PhpProfileUser
  error?: string
}

function maskToken(token?: string): string {
  if (!token) return ""
  if (token.length <= 12) return "***"
  return `${token.slice(0, 6)}...${token.slice(-6)}`
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    if (!isSessionJwtValid(token)) {
      const res = NextResponse.json({ message: "Unauthorized" }, { status: 401 })
      if (token) {
        res.cookies.set("session", "", { path: "/", maxAge: 0 })
      }
      return res
    }

    const base = process.env.PHP_API_BASE
    if (!base) {
      return NextResponse.json({ message: "Missing PHP_API_BASE" }, { status: 500 })
    }

    const phpUrl = `${base}/udp.php?objectcode=u_ajaxtest`
    // console.log("[auth/me] sending fetchprofile", {
    //   url: phpUrl,
    //   token: maskToken(token),
    // })

    const phpRes = await fetch(phpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ type: "fetchprofile", token }),
      cache: "no-store",
    })

    const raw = await phpRes.text()
    // console.log("[auth/me] php response", {
    //   status: phpRes.status,
    //   ok: phpRes.ok,
    //   preview: raw.slice(0, 200),
    // })

    let parsed: PhpProfileResponse | null = null

    try {
      parsed = raw ? (JSON.parse(raw) as PhpProfileResponse) : null
    } catch {
      return NextResponse.json({ message: "PHP returned non-JSON", raw }, { status: 502 })
    }

    const user = parsed?.user
    if (!phpRes.ok || !user || parsed?.error) {
      return NextResponse.json(
        { message: parsed?.error ?? "Unable to load profile", php: parsed, raw },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        userid: user.userid ?? "",
        name: user.name ?? "",
        email: user.email ?? "",
        avatar: "/next.svg",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Route crashed", error: message }, { status: 500 })
  }
}

