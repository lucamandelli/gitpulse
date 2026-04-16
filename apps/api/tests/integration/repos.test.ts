import { describe, it, expect, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/node.js'
import { buildTestApp, buildAuthenticatedApp } from '../helpers/build-app.js'
import { userFactory, accountFactory, repoFactory } from '../helpers/factories.js'

describe('POST /api/repos', () => {
  it('retorna 201 e persiste o repositório quando dados válidos', async () => {
    const user = await userFactory()
    await accountFactory(user.id, { accessToken: 'valid-token' })
    const app = await buildAuthenticatedApp({ id: user.id })
    afterAll(() => app.close())

    const response = await app.inject({
      method: 'POST',
      url: '/api/repos',
      headers: { 'content-type': 'application/json' },
      payload: { fullName: 'owner/repo' },
    })

    expect(response.statusCode).toBe(201)
    const body = response.json()
    expect(body.repository).toBeDefined()
    expect(body.repository.githubRepoName).toBe('owner/repo')
    expect(body.repository.userId).toBe(user.id)
  })

  it('retorna 400 quando fullName está em formato inválido', async () => {
    const user = await userFactory()
    const app = await buildAuthenticatedApp({ id: user.id })
    afterAll(() => app.close())

    const response = await app.inject({
      method: 'POST',
      url: '/api/repos',
      headers: { 'content-type': 'application/json' },
      payload: { fullName: 'semBarra' },
    })

    expect(response.statusCode).toBe(400)
    const body = response.json()
    expect(body.error).toBe('Invalid request body')
    expect(body.details).toBeDefined()
  })

  it('retorna 401 quando não autenticado', async () => {
    const app = await buildTestApp()
    afterAll(() => app.close())

    const response = await app.inject({
      method: 'POST',
      url: '/api/repos',
      headers: { 'content-type': 'application/json' },
      payload: { fullName: 'owner/repo' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('retorna 401 quando user não tem token GitHub no DB', async () => {
    const user = await userFactory()
    const app = await buildAuthenticatedApp({ id: user.id })
    afterAll(() => app.close())

    const response = await app.inject({
      method: 'POST',
      url: '/api/repos',
      headers: { 'content-type': 'application/json' },
      payload: { fullName: 'owner/repo' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ error: 'GitHub access token not found' })
  })

  it('retorna 401 quando token GitHub é inválido', async () => {
    const user = await userFactory()
    await accountFactory(user.id, { accessToken: 'invalid-token' })
    const app = await buildAuthenticatedApp({ id: user.id })
    afterAll(() => app.close())

    const response = await app.inject({
      method: 'POST',
      url: '/api/repos',
      headers: { 'content-type': 'application/json' },
      payload: { fullName: 'owner/repo' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ error: 'GitHub token is invalid or expired' })
  })

  it('retorna 404 quando repositório não existe no GitHub', async () => {
    const user = await userFactory()
    await accountFactory(user.id, { accessToken: 'valid-token' })
    const app = await buildAuthenticatedApp({ id: user.id })
    afterAll(() => app.close())

    const response = await app.inject({
      method: 'POST',
      url: '/api/repos',
      headers: { 'content-type': 'application/json' },
      payload: { fullName: 'nonexistent/nonexistent' },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().error).toContain('not found on GitHub')
  })

  it('retorna 409 quando repositório já está sendo monitorado', async () => {
    const user = await userFactory()
    await accountFactory(user.id, { accessToken: 'valid-token' })
    await repoFactory(user.id, { githubRepoName: 'owner/repo' })
    const app = await buildAuthenticatedApp({ id: user.id })
    afterAll(() => app.close())

    const response = await app.inject({
      method: 'POST',
      url: '/api/repos',
      headers: { 'content-type': 'application/json' },
      payload: { fullName: 'owner/repo' },
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({ error: 'Repository is already being monitored' })
  })
})

describe('GET /api/repos', () => {
  it('retorna 200 com apenas os repos do usuário autenticado', async () => {
    const userA = await userFactory()
    const userB = await userFactory()
    await repoFactory(userA.id, { githubRepoName: 'userA/repoA' })
    await repoFactory(userB.id, { githubRepoName: 'userB/repoB' })

    const app = await buildAuthenticatedApp({ id: userA.id })
    afterAll(() => app.close())

    const response = await app.inject({ method: 'GET', url: '/api/repos' })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.repositories).toHaveLength(1)
    expect(body.repositories[0].githubRepoName).toBe('userA/repoA')
  })

  it('retorna 401 quando não autenticado', async () => {
    const app = await buildTestApp()
    afterAll(() => app.close())

    const response = await app.inject({ method: 'GET', url: '/api/repos' })

    expect(response.statusCode).toBe(401)
  })
})

describe('DELETE /api/repos/:id', () => {
  it('retorna 200 e o repositório deletado quando é do próprio usuário', async () => {
    const user = await userFactory()
    const repo = await repoFactory(user.id)
    const app = await buildAuthenticatedApp({ id: user.id })
    afterAll(() => app.close())

    const response = await app.inject({ method: 'DELETE', url: `/api/repos/${repo.id}` })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.repository).toBeDefined()
    expect(body.repository.id).toBe(repo.id)
  })

  it('retorna 400 quando id não é um número', async () => {
    const user = await userFactory()
    const app = await buildAuthenticatedApp({ id: user.id })
    afterAll(() => app.close())

    const response = await app.inject({ method: 'DELETE', url: '/api/repos/abc' })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ error: 'Invalid repository ID' })
  })

  it('retorna 404 quando repo pertence a outro usuário', async () => {
    const userA = await userFactory()
    const userB = await userFactory()
    const repo = await repoFactory(userB.id)
    const app = await buildAuthenticatedApp({ id: userA.id })
    afterAll(() => app.close())

    const response = await app.inject({ method: 'DELETE', url: `/api/repos/${repo.id}` })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ error: 'Repository not found' })
  })

  it('retorna 401 quando não autenticado', async () => {
    const app = await buildTestApp()
    afterAll(() => app.close())

    const response = await app.inject({ method: 'DELETE', url: '/api/repos/1' })

    expect(response.statusCode).toBe(401)
  })
})
