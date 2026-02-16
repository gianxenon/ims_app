export const ACTIVE_COMPANY_KEY = "active_company"
export const ACTIVE_BRANCH_KEY = "active_branch"
export const ACTIVE_BRANCH_EVENT = "active-branch-changed"

export type ActiveBranchSelection = {
  companyCode: string
  branchCode: string
}

function readCookieValue(key: string): string {
  if (typeof document === "undefined") return ""

  const pair = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${key}=`))

  if (!pair) return ""
  return decodeURIComponent(pair.slice(key.length + 1))
}

export function readActiveSelection(): ActiveBranchSelection | null {
  let companyCode = ""
  let branchCode = ""

  try {
    companyCode = window.localStorage.getItem(ACTIVE_COMPANY_KEY) ?? ""
    branchCode = window.localStorage.getItem(ACTIVE_BRANCH_KEY) ?? ""
  } catch {
  }

  if (!companyCode) companyCode = readCookieValue(ACTIVE_COMPANY_KEY)
  if (!branchCode) branchCode = readCookieValue(ACTIVE_BRANCH_KEY)

  companyCode = companyCode.trim()
  branchCode = branchCode.trim()

  if (!companyCode || !branchCode) return null
  return { companyCode, branchCode }
}

export function persistActiveSelection(companyCode: string, branchCode: string) {
  const company = companyCode.trim()
  const branch = branchCode.trim()

  document.cookie = `${ACTIVE_COMPANY_KEY}=${encodeURIComponent(company)}; path=/; max-age=31536000; samesite=lax`
  document.cookie = `${ACTIVE_BRANCH_KEY}=${encodeURIComponent(branch)}; path=/; max-age=31536000; samesite=lax`

  try {
    window.localStorage.setItem(ACTIVE_COMPANY_KEY, company)
    window.localStorage.setItem(ACTIVE_BRANCH_KEY, branch)
  } catch {
  }

  window.dispatchEvent(
    new CustomEvent<ActiveBranchSelection>(ACTIVE_BRANCH_EVENT, {
      detail: { companyCode: company, branchCode: branch },
    })
  )
}

