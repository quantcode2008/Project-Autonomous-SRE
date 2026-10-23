import path from 'node:path'
import { AppError } from '../../lib/errors'

const GITHUB_REPO_REGEX = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/

export function validateRepoLocation(provider: 'LOCAL' | 'GITHUB', location: string): void {
  const trimmed = location.trim()

  if (provider === 'GITHUB') {
    if (!GITHUB_REPO_REGEX.test(trimmed)) {
      throw AppError.badRequest(
        'Invalid GitHub repository URL. Must be in the format https://github.com/<owner>/<repo>',
        [{ path: 'location', issue: 'Must be https://github.com/<owner>/<repo>' }],
      )
    }
    return
  }

  if (provider === 'LOCAL') {
    // Local demo repository paths must reside under the allowed demo directory
    if (trimmed.includes('..')) {
      throw AppError.badRequest('Path traversal (..) is strictly prohibited in local repo location', [
        { path: 'location', issue: 'Cannot contain relative path traversal' },
      ])
    }

    const normalized = path.normalize(trimmed).replace(/\\/g, '/')
    if (!normalized.startsWith('demo') && !normalized.startsWith('./demo')) {
      throw AppError.badRequest('Local repository location must be under demo/', [
        { path: 'location', issue: 'Must be within demo/ directory' },
      ])
    }
    return
  }

  throw AppError.badRequest('Unsupported repository provider')
}
