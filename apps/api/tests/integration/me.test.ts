import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, mockSession } from '../helpers/build-app.js'
import { userFactory } from '../helpers/factories.js'

const USER_ID = 'test-me-user-id'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})

afterAll(async () => app.close())

describe('GET /api/user/me — autenticado', () => {
  beforeEach(() => {
    mockSession(USER_ID)
  })

  it('retorna 200 com user e session', async () => {
    await userFactory({ id: USER_ID })

    const response = await app.inject({ method: 'GET', url: '/api/user/me' })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.user).toBeDefined()
    expect(body.session).toBeDefined()
    expect(body.user.id).toBe(USER_ID)
  })
})

describe('GET /api/user/me — anônimo', () => {
  it('retorna 401 quando não autenticado', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/user/me' })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ error: 'Unauthorized' })
  })
})
