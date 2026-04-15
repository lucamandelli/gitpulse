import { FastifyPluginAsync } from 'fastify'
import authGuard from '../plugins/auth-guard'

const meRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(authGuard)

  fastify.get('/api/user/me', async (request) => {
    return { user: request.user, session: request.session }
  })
}

export default meRoutes
