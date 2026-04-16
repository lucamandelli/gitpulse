import { config } from 'dotenv'
import { resolve } from 'node:path'
import { beforeAll, afterEach, afterAll, beforeEach } from 'vitest'
import { server } from './mocks/node.js'
import { resetDatabase } from './helpers/db.js'

config({ path: resolve(process.cwd(), '.env.test') })

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(async () => {
  await resetDatabase()
})
