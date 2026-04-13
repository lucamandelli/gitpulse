import { FastifyPluginAsync } from 'fastify'
import { pool } from '../db'

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_, reply) => {
    try {
      await pool.query('SELECT 1')
      return { status: 'ok', db: 'connected' }
    } catch {
      reply.status(503)
      return { status: 'ok', db: 'disconnected' }
    }
  })
}

export default healthRoutes
