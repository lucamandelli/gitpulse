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

export async function buildAuthenticatedApp(
  user?: Partial<User>,
  session?: Partial<Session>,
): Promise<FastifyInstance> {
  const userFixture: User = {
    id: user?.id ?? 'test-user-id',
    name: user?.name ?? 'Test User',
    email: user?.email ?? 'test@example.com',
    emailVerified: user?.emailVerified ?? false,
    image: user?.image ?? null,
    createdAt: user?.createdAt ?? new Date(),
    updatedAt: user?.updatedAt ?? new Date(),
  }

  const sessionFixture: Session = {
    id: session?.id ?? 'test-session-id',
    userId: userFixture.id,
    token: session?.token ?? 'test-token',
    expiresAt: session?.expiresAt ?? new Date(Date.now() + 86400000),
    createdAt: session?.createdAt ?? new Date(),
    updatedAt: session?.updatedAt ?? new Date(),
    ipAddress: session?.ipAddress ?? null,
    userAgent: session?.userAgent ?? null,
  }

  vi.spyOn(auth.api, 'getSession').mockResolvedValue({
    user: userFixture,
    session: sessionFixture,
  })

  const app = await buildApp()
  await app.ready()
  return app
}
