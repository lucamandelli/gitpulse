import { http, HttpResponse } from 'msw'

const BASE = 'https://api.github.com'

export const githubHandlers = [
  http.get(`${BASE}/repos/:owner/:repo`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || authHeader === 'Bearer invalid-token') {
      return HttpResponse.json({ message: 'Bad credentials' }, { status: 401 })
    }

    const { owner, repo } = params as { owner: string; repo: string }
    const fullName = `${owner}/${repo}`

    if (owner === 'nonexistent' || repo === 'nonexistent') {
      return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
    }

    return HttpResponse.json({
      full_name: fullName,
      html_url: `https://github.com/${fullName}`,
      private: false,
      description: 'A test repository',
      default_branch: 'main',
      stargazers_count: 42,
    })
  }),
]
