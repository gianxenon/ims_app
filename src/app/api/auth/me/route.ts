import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { isSessionJwtValid } from "@/src/shared/auth/session"
import { callPhp } from "@/src/infrastructure/php-client"

const phpProfileUserSchema = z.looseObject({
    userid: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    token: z.string().optional(),
    USERID: z.string().optional(),
    USERNAME: z.string().optional(),
    GROUPID: z.string().optional(),
    ROLEID: z.string().optional(),
    ISVALID: z.union([z.string(), z.number()]).optional(),
    LOCKOUT: z.union([z.string(), z.number()]).optional(),
    EMAIL: z.string().optional(),
    MOBILENO: z.string().optional(),
  })

const phpProfileObjectSchema = z.looseObject({
    user: phpProfileUserSchema.optional(),
    rows: z.array(phpProfileUserSchema).optional(),
    error: z.string().optional(),
  })

function parsePhpProfile(parsed: unknown): {
  user?: z.infer<typeof phpProfileUserSchema>
  error?: string
} {
  if (Array.isArray(parsed)) {
    const rowsResult = z.array(phpProfileUserSchema).safeParse(parsed)
    if (!rowsResult.success) return {}
    return { user: rowsResult.data[0] }
  }

  const objectResult = phpProfileObjectSchema.safeParse(parsed)
  if (!objectResult.success) return {}

  const rowUser = objectResult.data.rows?.[0]
  return {
    user: objectResult.data.user ?? rowUser,
    error: objectResult.data.error,
  }
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

    const callProfile = async (includeToken: boolean) =>
      callPhp({
        payload: includeToken ? { type: "fetchprofile", token } : { type: "fetchprofile" },
      })

    let result = await callProfile(false)
    let profile = result.ok ? parsePhpProfile(result.parsed) : {}

    if (!result.ok || !profile.user || profile.error) {
      result = await callProfile(true)
      profile = result.ok ? parsePhpProfile(result.parsed) : {}
    }

    if (!result.ok) {
      return NextResponse.json(
        { message: "Unable to load profile", error: result.error, raw: result.raw },
        { status: result.status }
      )
    }

    if (!profile.user || profile.error) {
      return NextResponse.json(
        {
          message: profile.error ?? "Unable to load profile",
          php: result.parsed,
          raw: result.raw,
        },
        { status: 401 }
      )
    }

    const user = profile.user
    const userid = user.userid ?? user.USERID ?? ""
    const name = user.name ?? user.USERNAME ?? userid
    const email = user.email ?? user.EMAIL ?? ""

    return NextResponse.json({
      user: {
        userid,
        name,
        email,
        groupid: user.GROUPID ?? "",
        roleid: user.ROLEID ?? "",
        isValid: String(user.ISVALID ?? ""),
        lockout: String(user.LOCKOUT ?? ""),
        mobileNo: user.MOBILENO ?? "",
        avatar: "/next.svg",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Route crashed", error: message }, { status: 500 })
  }
}
