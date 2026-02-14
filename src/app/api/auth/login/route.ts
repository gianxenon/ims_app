import { NextResponse } from "next/server"

type LoginBody = {
  userid: string
  password: string
}

type PhpAuthSuccess = { success: true; jwt: string }
type PhpAuthFail = { success: false; message?: string }

export async function POST(req: Request) {
  try {
    const { userid, password } = (await req.json()) as LoginBody

    const base = process.env.PHP_API_BASE
    if (!base) {
      return NextResponse.json(
        { message: "Missing PHP_API_BASE in .env.local" },
        { status: 500 }
      )
    }

    const phpUrl = `${base}/udp.php?objectcode=auth`
 
    const phpRes = await fetch(phpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ userid, password }),
      cache: "no-store",
    })

    const raw = await phpRes.text()
    let data: PhpAuthSuccess | PhpAuthFail | null = null

    try {
      data = raw ? (JSON.parse(raw) as PhpAuthSuccess | PhpAuthFail) : null
    } catch {
      return NextResponse.json({ message: "PHP returned non-JSON", raw }, { status: 502 })
    }

    if (!phpRes.ok || !data || data.success !== true) {
      return NextResponse.json(
        { message: (data as PhpAuthFail)?.message ?? "Unauthorized", php: data, raw },
        { status: 401 }
      )
    } 
    const jwt = (data as PhpAuthSuccess).jwt
    if (!jwt) {
      return NextResponse.json(
        { message: "Login success but jwt is empty", php: data },
        { status: 500 }
      )
    } 
    const res = NextResponse.json({ ok: true })
    res.cookies.set("session", jwt, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 3,
    }) 
    return res
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Route crashed", error: message }, { status: 500 })
  }
}
