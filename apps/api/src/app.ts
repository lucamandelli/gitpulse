import fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import healthRoutes from './routes/health'

export function buildApp(): FastifyInstance {
  const app = fastify({ logger: true })

  app.register(healthRoutes)

  return app
}
