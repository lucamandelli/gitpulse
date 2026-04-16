import { FastifyPluginAsync } from 'fastify'
import authGuard, { AuthenticatedRequest } from '@/plugins/auth-guard'

const meRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(authGuard)

  fastify.get('/api/user/me', async (request) => {
    const { user, session } = request as AuthenticatedRequest
    return { user, session }
  })
}

export default meRoutes
