import { z } from 'zod'

const githubRepoSchema = z.object({
  full_name: z.string(),
  html_url: z.string().url(),
  private: z.boolean(),
  description: z.string().nullable(),
  default_branch: z.string(),
  stargazers_count: z.number().int(),
})

export type GitHubRepoInfo = z.infer<typeof githubRepoSchema>

export class GitHubTokenNotFoundError extends Error {
  constructor() {
    super('GitHub access token not found for user')
    this.name = 'GitHubTokenNotFoundError'
  }
}

export class GitHubUnauthorizedError extends Error {
  constructor() {
    super('GitHub token is invalid or expired')
    this.name = 'GitHubUnauthorizedError'
  }
}

export class GitHubRepoNotFoundError extends Error {
  constructor(fullName: string) {
    super(`Repository "${fullName}" not found or not accessible`)
    this.name = 'GitHubRepoNotFoundError'
  }
}

export class GitHubApiError extends Error {
  constructor(status: number, message: string) {
    super(`GitHub API error (${status}): ${message}`)
    this.name = 'GitHubApiError'
  }
}

export async function fetchGitHubRepo(
  accessToken: string,
  fullName: string,
): Promise<GitHubRepoInfo> {
  let response: Response

  try {
    response = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GitPulse',
      },
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    throw new GitHubApiError(0, 'Request timed out or failed')
  }

  if (response.status === 401) {
    throw new GitHubUnauthorizedError()
  }

  if (response.status === 404) {
    throw new GitHubRepoNotFoundError(fullName)
  }

  if (!response.ok) {
    const text = await response.text()
    throw new GitHubApiError(response.status, text)
  }

  const data = await response.json()
  const parsed = githubRepoSchema.safeParse(data)

  if (!parsed.success) {
    throw new GitHubApiError(0, 'Unexpected GitHub API response shape')
  }

  return parsed.data
}
