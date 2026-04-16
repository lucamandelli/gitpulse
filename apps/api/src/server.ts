import { env } from '@/config/env'
import { buildApp } from './app.js'

const start = async () => {
  try {
    const app = await buildApp()

    await app.listen({
      port: env.API_PORT,
      host: '0.0.0.0',
    })
  } catch (err) {
    process.stderr.write(`${err}\n`)
    process.exit(1)
  }
}

start()
