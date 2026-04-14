import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../lib/auth'

declare module 'fastify' {
  interface FastifyRequest {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}

const authGuardPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('user', null)
  fastify.decorateRequest('session', null)

  fastify.addHook('onRequest', async (request, reply) => {
    const headers = fromNodeHeaders(request.headers)
    const sessionData = await auth.api.getSession({ headers })

    if (!sessionData) {
      reply.status(401).send({ error: 'Unauthorized' })
      return
    }

    request.user = sessionData.user
    request.session = sessionData.session
  })
}

export default fp(authGuardPlugin, { name: 'auth-guard' })
