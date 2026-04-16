import { setupServer } from 'msw/node'
import { githubHandlers } from './handlers/github.js'

export const server = setupServer(...githubHandlers)
