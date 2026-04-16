import { db } from '@/db/client'
import { users, accounts, repositories } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

type User = InferSelectModel<typeof users>
type Repository = InferSelectModel<typeof repositories>

let idCounter = 0
const nextId = () => `test-${++idCounter}-${Date.now()}`

export async function userFactory(overrides?: Partial<User>): Promise<User> {
  const id = nextId()
  const [user] = await db
    .insert(users)
    .values({
      id,
      name: overrides?.name ?? 'Test User',
      email: overrides?.email ?? `test-${id}@example.com`,
      emailVerified: overrides?.emailVerified ?? false,
      image: overrides?.image ?? null,
    })
    .returning()
  return user
}

export async function accountFactory(
  userId: string,
  overrides?: { providerId?: string; accessToken?: string },
) {
  const [account] = await db
    .insert(accounts)
    .values({
      id: nextId(),
      accountId: userId,
      providerId: overrides?.providerId ?? 'github',
      userId,
      accessToken: overrides?.accessToken ?? 'fake-github-token',
    })
    .returning()
  return account
}

export async function repoFactory(
  userId: string,
  overrides?: Partial<Repository>,
): Promise<Repository> {
  const name = overrides?.githubRepoName ?? `owner/repo-${Date.now()}`
  const [repo] = await db
    .insert(repositories)
    .values({
      userId,
      githubRepoName: name,
      githubRepoUrl: overrides?.githubRepoUrl ?? `https://github.com/${name}`,
      isPrivate: overrides?.isPrivate ?? false,
      description: overrides?.description ?? null,
      defaultBranch: overrides?.defaultBranch ?? 'main',
      stars: overrides?.stars ?? 0,
    })
    .returning()
  return repo
}
