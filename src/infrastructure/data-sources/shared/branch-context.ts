type BranchContextMissing = { ok: false; message: string }
type BranchContextPresent = { ok: true; company: string; branch: string }

const BRANCH_REQUIRED_MESSAGE = "Select a branch first."

export function requireBranchContext(
  company?: string,
  branch?: string
): BranchContextPresent | BranchContextMissing {
  const companyCode = (company ?? "").trim()
  const branchCode = (branch ?? "").trim()

  if (!companyCode || !branchCode) {
    return { ok: false, message: BRANCH_REQUIRED_MESSAGE }
  }

  return { ok: true, company: companyCode, branch: branchCode }
}
