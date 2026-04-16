import { vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '@/app'
import { auth } from '@/lib/auth'
import type { User, Session } from 'better-auth'

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = await buildApp()
  await app.ready()
  return app
}

export function mockSession(userId: string, overrides?: { user?: Partial<User>; session?: Partial<Session> }) {
  const userFixture: User = {
    id: userId,
    name: overrides?.user?.name ?? 'Test User',
    email: overrides?.user?.email ?? `${userId}@example.com`,
    emailVerified: overrides?.user?.emailVerified ?? false,
    image: overrides?.user?.image ?? null,
    createdAt: overrides?.user?.createdAt ?? new Date(),
    updatedAt: overrides?.user?.updatedAt ?? new Date(),
  }

  const sessionFixture: Session = {
    id: overrides?.session?.id ?? 'test-session-id',
    userId,
    token: overrides?.session?.token ?? 'test-token',
    expiresAt: overrides?.session?.expiresAt ?? new Date(Date.now() + 86400000),
    createdAt: overrides?.session?.createdAt ?? new Date(),
    updatedAt: overrides?.session?.updatedAt ?? new Date(),
    ipAddress: overrides?.session?.ipAddress ?? null,
    userAgent: overrides?.session?.userAgent ?? null,
  }

  vi.spyOn(auth.api, 'getSession').mockResolvedValue({
    user: userFixture,
    session: sessionFixture,
  })

  return { userFixture, sessionFixture }
}
