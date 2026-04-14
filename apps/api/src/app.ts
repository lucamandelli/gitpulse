import fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { pool } from './db'
import healthRoutes from './routes/health'

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({ logger: true })

  app.addHook('onClose', async () => {
    await pool.end()
  })

  app.register(healthRoutes)

  return app
}
