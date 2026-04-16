import fastify from 'fastify'
import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'
import { pool } from '@/db'
import { env } from '@/config/env'
import healthRoutes from '@/routes/health'
import authRoutes from '@/routes/auth'
import meRoutes from '@/routes/me'
import reposRoutes from '@/routes/repos'

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({ logger: true })

  app.register(cors, {
    origin: [env.CORS_ORIGIN],
    credentials: true,
  })

  app.addHook('onClose', async () => {
    await pool.end()
  })

  app.register(healthRoutes)
  app.register(authRoutes)
  app.register(meRoutes)
  app.register(reposRoutes)

  return app
}
