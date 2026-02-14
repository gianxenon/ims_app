type JwtPayload = {
  exp?: number
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  return atob(padded)
}

export function isSessionJwtValid(token?: string): boolean {
  if (!token) return false

  const parts = token.split(".")
  if (parts.length !== 3) return true

  try {
    const payloadJson = decodeBase64Url(parts[1])
    const payload = JSON.parse(payloadJson) as JwtPayload

    if (payload.exp === undefined) return true
    if (typeof payload.exp !== "number") return false

    return Date.now() < payload.exp * 1000
  } catch {
    return true
  }
}
