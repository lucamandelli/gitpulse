import fastify from 'fastify'

const server = fastify({ logger: true })

server.get('/health', async () => {
  return { status: 'ok' }
})

const start = async () => {
  try {
    await server.listen({
      port: Number(process.env.API_PORT) || 3333,
      host: '0.0.0.0',
    })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
