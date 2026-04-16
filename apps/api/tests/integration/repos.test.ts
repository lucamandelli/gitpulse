import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp, mockSession } from '../helpers/build-app.js'
import { userFactory, accountFactory, repoFactory } from '../helpers/factories.js'

const USER_A_ID = 'test-repos-user-a'
const USER_B_ID = 'test-repos-user-b'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})

afterAll(async () => app.close())

describe('POST /api/repos', () => {
  beforeEach(() => {
    mockSession(USER_A_ID)
  })

  it('retorna 201 e persiste o repositório quando dados válidos', async () => {
    await userFactory({ id: USER_A_ID })
    await accountFactory(USER_A_ID, { accessToken: 'valid-token' })

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
    expect(body.repository.userId).toBe(USER_A_ID)
  })

  it('retorna 400 quando fullName está em formato inválido', async () => {
    await userFactory({ id: USER_A_ID })

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

  it('retorna 401 quando user não tem token GitHub no DB', async () => {
    await userFactory({ id: USER_A_ID })

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
    await userFactory({ id: USER_A_ID })
    await accountFactory(USER_A_ID, { accessToken: 'invalid-token' })

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
    await userFactory({ id: USER_A_ID })
    await accountFactory(USER_A_ID, { accessToken: 'valid-token' })

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
    await userFactory({ id: USER_A_ID })
    await accountFactory(USER_A_ID, { accessToken: 'valid-token' })
    await repoFactory(USER_A_ID, { githubRepoName: 'owner/repo' })

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
  beforeEach(() => {
    mockSession(USER_A_ID)
  })

  it('retorna 200 com apenas os repos do usuário autenticado', async () => {
    await userFactory({ id: USER_A_ID })
    await userFactory({ id: USER_B_ID })
    await repoFactory(USER_A_ID, { githubRepoName: 'userA/repoA' })
    await repoFactory(USER_B_ID, { githubRepoName: 'userB/repoB' })

    const response = await app.inject({ method: 'GET', url: '/api/repos' })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.repositories).toHaveLength(1)
    expect(body.repositories[0].githubRepoName).toBe('userA/repoA')
  })
})

describe('DELETE /api/repos/:id', () => {
  beforeEach(() => {
    mockSession(USER_A_ID)
  })

  it('retorna 200 e o repositório deletado quando é do próprio usuário', async () => {
    await userFactory({ id: USER_A_ID })
    const repo = await repoFactory(USER_A_ID)

    const response = await app.inject({ method: 'DELETE', url: `/api/repos/${repo.id}` })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.repository).toBeDefined()
    expect(body.repository.id).toBe(repo.id)
  })

  it('retorna 400 quando id não é um número', async () => {
    await userFactory({ id: USER_A_ID })

    const response = await app.inject({ method: 'DELETE', url: '/api/repos/abc' })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ error: 'Invalid repository ID' })
  })

  it('retorna 404 quando repo pertence a outro usuário', async () => {
    await userFactory({ id: USER_A_ID })
    await userFactory({ id: USER_B_ID })
    const repo = await repoFactory(USER_B_ID)

    const response = await app.inject({ method: 'DELETE', url: `/api/repos/${repo.id}` })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ error: 'Repository not found' })
  })
})

describe('rotas de repos — anônimo', () => {
  it('POST /api/repos retorna 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/repos',
      headers: { 'content-type': 'application/json' },
      payload: { fullName: 'owner/repo' },
    })
    expect(response.statusCode).toBe(401)
  })

  it('GET /api/repos retorna 401', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/repos' })
    expect(response.statusCode).toBe(401)
  })

  it('DELETE /api/repos/:id retorna 401', async () => {
    const response = await app.inject({ method: 'DELETE', url: '/api/repos/1' })
    expect(response.statusCode).toBe(401)
  })
})
