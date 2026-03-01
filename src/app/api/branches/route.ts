import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { isSessionJwtValid } from "@/src/shared/auth/session"
import { callPhp, extractPhpRows } from "@/src/infrastructure/php-client"

const branchApiRowSchema = z.looseObject({
  COMPANYCODE: z.string().optional(),
  companycode: z.string().optional(),
  BRANCHCODE: z.string().optional(),
  branchcode: z.string().optional(),
  BRANCHNAME: z.string().optional(),
  branchname: z.string().optional(),
})

const phpProfileUserSchema = z.looseObject({
  userid: z.string().optional(),
  USERID: z.string().optional(),
})

const phpProfileObjectSchema = z.looseObject({
  user: phpProfileUserSchema.optional(),
  rows: z.array(phpProfileUserSchema).optional(),
})

function extractUserIdFromProfile(parsed: unknown): string {
  if (Array.isArray(parsed)) {
    const rowsResult = z.array(phpProfileUserSchema).safeParse(parsed)
    if (!rowsResult.success) return ""
    const row = rowsResult.data[0]
    return String(row?.userid ?? row?.USERID ?? "").trim()
  }

  const objectResult = phpProfileObjectSchema.safeParse(parsed)
  if (!objectResult.success) return ""

  const user = objectResult.data.user ?? objectResult.data.rows?.[0]
  return String(user?.userid ?? user?.USERID ?? "").trim()
}

async function resolveUserIdFromSession(): Promise<{ userid: string; unauthorized?: boolean; clearCookie?: boolean }> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value

  if (!isSessionJwtValid(token)) {
    return { userid: "", unauthorized: true, clearCookie: Boolean(token) }
  }

  const profileResult = await callPhp({
    payload: token ? { type: "fetchprofile", token } : { type: "fetchprofile" },
  })

  if (!profileResult.ok) {
    return { userid: "", unauthorized: true }
  }

  const userid = extractUserIdFromProfile(profileResult.parsed)
  if (!userid) {
    return { userid: "", unauthorized: true }
  }

  return { userid }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    let userid = url.searchParams.get("userid")?.trim() ?? ""

    if (!userid) {
      const resolved = await resolveUserIdFromSession()
      if (!resolved.userid) {
        const res = NextResponse.json(
          { message: "Unauthorized. Missing userid and no valid session." },
          { status: 401 }
        )
        if (resolved.clearCookie) {
          res.cookies.set("session", "", { path: "/", maxAge: 0 })
        }
        return res
      }
      userid = resolved.userid
    }

    const phpResult = await callPhp({
      payload: { type: "getbranches", userid },
    })

    if (!phpResult.ok) {
      return NextResponse.json(
        { message: "Branches API request failed", error: phpResult.error, raw: phpResult.raw },
        { status: phpResult.status }
      )
    }

    const rawRows = extractPhpRows(phpResult.parsed)
    const parsedRows = z.array(branchApiRowSchema).safeParse(rawRows)

    if (!parsedRows.success) {
      return NextResponse.json(
        {
          message: "Branches API payload shape invalid",
          issues: parsedRows.error.issues,
        },
        { status: 502 }
      )
    }

    const branches = parsedRows.data.map((row) => ({
      companyCode: String(row.COMPANYCODE ?? row.companycode ?? ""),
      branchCode: String(row.BRANCHCODE ?? row.branchcode ?? ""),
      branchName: String(row.BRANCHNAME ?? row.branchname ?? ""),
    }))

    return NextResponse.json({ branches, userid })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ message: "Failed to load branches", error: message }, { status: 500 })
  }
}
