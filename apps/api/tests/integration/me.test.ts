import { describe, it, expect, afterAll } from 'vitest'
import { buildTestApp, buildAuthenticatedApp } from '../helpers/build-app.js'
import { userFactory } from '../helpers/factories.js'

describe('GET /api/user/me', () => {
  it('retorna 200 com user e session quando autenticado', async () => {
    const user = await userFactory()
    const app = await buildAuthenticatedApp({ id: user.id, email: user.email, name: user.name })
    afterAll(() => app.close())

    const response = await app.inject({ method: 'GET', url: '/api/user/me' })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.user).toBeDefined()
    expect(body.session).toBeDefined()
    expect(body.user.id).toBe(user.id)
  })

  it('retorna 401 quando não autenticado', async () => {
    const app = await buildTestApp()
    afterAll(() => app.close())

    const response = await app.inject({ method: 'GET', url: '/api/user/me' })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ error: 'Unauthorized' })
  })
})
