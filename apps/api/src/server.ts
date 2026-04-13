import { buildApp } from './app'

const app = buildApp()

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.API_PORT) || 3333,
      host: '0.0.0.0',
    })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
