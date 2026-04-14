import fastify from 'fastify'
import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'
import { pool } from './db'
import healthRoutes from './routes/health'
import authRoutes from './routes/auth'

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({ logger: true })

  app.register(cors, {
    origin: ['http://localhost:3000'],
    credentials: true,
  })

  app.addHook('onClose', async () => {
    await pool.end()
  })

  app.register(healthRoutes)
  app.register(authRoutes)

  return app
}
