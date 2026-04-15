import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/client'
import { repositories, accounts } from '../db/schema'
import authGuard from '../plugins/auth-guard'
import {
  fetchGitHubRepo,
  GitHubTokenNotFoundError,
  GitHubUnauthorizedError,
  GitHubRepoNotFoundError,
  GitHubApiError,
} from '../lib/github'

async function getUserGitHubToken(userId: string): Promise<string> {
  const [account] = await db
    .select({ accessToken: accounts.accessToken })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'github')))
    .limit(1)

  if (!account?.accessToken) {
    throw new GitHubTokenNotFoundError()
  }

  return account.accessToken
}

const addRepoBodySchema = z.object({
  fullName: z
    .string()
    .regex(/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/, 'Must be in "owner/repo" format'),
})

const reposRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(authGuard)

  fastify.post('/api/repos', async (request, reply) => {
    const parsed = addRepoBodySchema.safeParse(request.body)

    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Invalid request body', details: parsed.error.flatten().fieldErrors })
    }

    const { fullName } = parsed.data
    const userId = request.user!.id

    let accessToken: string

    try {
      accessToken = await getUserGitHubToken(userId)
    } catch (err) {
      if (err instanceof GitHubTokenNotFoundError) {
        return reply.status(401).send({ error: 'GitHub access token not found' })
      }
      throw err
    }

    let repoInfo

    try {
      repoInfo = await fetchGitHubRepo(accessToken, fullName)
    } catch (err) {
      if (err instanceof GitHubUnauthorizedError) {
        return reply.status(401).send({ error: 'GitHub token is invalid or expired' })
      }
      if (err instanceof GitHubRepoNotFoundError) {
        return reply.status(404).send({ error: `Repository "${fullName}" not found on GitHub` })
      }
      if (err instanceof GitHubApiError) {
        return reply.status(502).send({ error: 'GitHub API error' })
      }
      throw err
    }

    const [repo] = await db
      .insert(repositories)
      .values({
        userId,
        githubRepoName: repoInfo.full_name,
        githubRepoUrl: repoInfo.html_url,
        isPrivate: repoInfo.private,
        description: repoInfo.description,
        defaultBranch: repoInfo.default_branch,
        stars: repoInfo.stargazers_count,
      })
      .onConflictDoNothing()
      .returning()

    if (!repo) {
      return reply.status(409).send({ error: 'Repository is already being monitored' })
    }

    return reply.status(201).send({ repository: repo })
  })

  fastify.get('/api/repos', async (request, reply) => {
    const userId = request.user!.id

    const repos = await db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, userId))

    return reply.send({ repositories: repos })
  })

  fastify.delete<{ Params: { id: string } }>('/api/repos/:id', async (request, reply) => {
    const repoId = Number(request.params.id)

    if (isNaN(repoId)) {
      return reply.status(400).send({ error: 'Invalid repository ID' })
    }

    const userId = request.user!.id

    const deleted = await db
      .delete(repositories)
      .where(and(eq(repositories.id, repoId), eq(repositories.userId, userId)))
      .returning()

    if (deleted.length === 0) {
      return reply.status(404).send({ error: 'Repository not found' })
    }

    return reply.send({ repository: deleted[0] })
  })
}

export default reposRoutes
