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

type ApiUser = {
  userid: string
  name: string
  email: string
  groupid: string
  roleid: string
  isValid: string
  lockout: string
  mobileNo: string
  avatar: string
}

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

function decodeJwtPayload(token?: string): Record<string, unknown> {
  if (!token) return {}

  const parts = token.split(".")
  if (parts.length !== 3) return {}

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
    const decoded = Buffer.from(padded, "base64").toString("utf8")
    const payload = JSON.parse(decoded)

    return payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function buildUserFromToken(token?: string): ApiUser | null {
  const payload = decodeJwtPayload(token)
  const userNode = payload.user
  const user =
    userNode && typeof userNode === "object"
      ? (userNode as Record<string, unknown>)
      : {}

  const userid = String(
    typeof user.id === "string"
      ? user.id
      : typeof user.userid === "string"
      ? user.userid
      : typeof payload.userid === "string"
      ? payload.userid
      : ""
  ).trim()

  if (!userid) return null

  const name = String(
    typeof user.name === "string" ? user.name : userid
  ).trim() || userid

  const email = String(typeof user.email === "string" ? user.email : "").trim()
  const groupid = String(
    typeof user.groupid === "string" ? user.groupid : ""
  ).trim()

  return {
    userid,
    name,
    email,
    groupid,
    roleid: "",
    isValid: "",
    lockout: "",
    mobileNo: "",
    avatar: "/next.svg",
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

    const tokenUser = buildUserFromToken(token)

    const result = await callPhp({
      payload: {
        type: "fetchprofile",
        token,
        userid: tokenUser?.userid ?? "",
      },
    })

    const profile = result.ok ? parsePhpProfile(result.parsed) : {}

    if (!result.ok) {
      if (tokenUser) {
        return NextResponse.json({ user: tokenUser })
      }
      return NextResponse.json(
        { message: "Unable to load profile", error: result.error, raw: result.raw },
        { status: result.status }
      )
    }

    if (!profile.user || profile.error) {
      if (tokenUser) {
        return NextResponse.json({ user: tokenUser })
      }
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
    const userid = (user.userid ?? user.USERID ?? tokenUser?.userid ?? "").trim()
    if (!userid) {
      if (tokenUser) {
        return NextResponse.json({ user: tokenUser })
      }
      return NextResponse.json(
        { message: "Invalid profile payload. Missing userid." },
        { status: 401 }
      )
    }

    const name = (user.name ?? user.USERNAME ?? tokenUser?.name ?? userid).trim()
    const email = (user.email ?? user.EMAIL ?? tokenUser?.email ?? "").trim()

    return NextResponse.json({
      user: {
        userid,
        name,
        email,
        groupid: user.GROUPID ?? tokenUser?.groupid ?? "",
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
