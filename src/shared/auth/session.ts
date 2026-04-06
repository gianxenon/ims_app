type JwtPayload = {
  exp?: number | string
}

type JwtUserPayload = {
  user?: Record<string, unknown>
  userid?: unknown
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  if (typeof atob === "function") {
    return atob(padded)
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf8")
  }
  throw new Error("No base64 decoder available")
}

export function isSessionJwtValid(token?: string): boolean {
  if (!token) return false

  const parts = token.split(".")
  if (parts.length !== 3) return false

  try {
    const payloadJson = decodeBase64Url(parts[1])
    const payload = JSON.parse(payloadJson) as JwtPayload

    if (payload.exp === undefined) return true

    const expValue = typeof payload.exp === "number" ? payload.exp : Number(payload.exp)
    if (!Number.isFinite(expValue)) return false

    return Date.now() < expValue * 1000
  } catch {
    return false
  }
}

export function extractSessionUserId(token?: string): string {
  if (!token) return ""

  const parts = token.split(".")
  if (parts.length !== 3) return ""

  try {
    const payloadJson = decodeBase64Url(parts[1])
    const payload = JSON.parse(payloadJson) as JwtUserPayload
    const user = payload.user && typeof payload.user === "object" ? payload.user : {}

    const userid =
      typeof user.id === "string"
        ? user.id
        : typeof user.userid === "string"
        ? user.userid
        : typeof payload.userid === "string"
        ? payload.userid
        : ""

    return String(userid).trim()
  } catch {
    return ""
  }
}
