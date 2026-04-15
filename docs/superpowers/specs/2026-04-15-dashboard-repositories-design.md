# Dashboard de Repositórios + Fix Redirect

## Contexto

Após a implementação da autenticação com BetterAuth (issue #5), o fluxo pós-login redireciona o usuário para `localhost:3333` (API) em vez do frontend, mostrando um 404. Além do fix, o dashboard atual exibe apenas placeholders estáticos. Esta issue implementa a primeira versão funcional do dashboard: CRUD de repositórios observados com busca via GitHub API.

## Escopo

1. **Fix do redirect pós-login** — `callbackURL` relativo resolve contra o backend
2. **Dashboard com dois estados** — empty state e lista de repositórios
3. **Modal de busca e adição** — busca no GitHub com seleção múltipla
4. **Remoção de repositórios** — com confirmação
5. **Backend como proxy** — endpoints protegidos que usam o access_token do usuário

## Fora do escopo

- Conteúdo rico nos cards (summaries, stats, atividade) — issue futura
- Repos favoritos/pinned — faz sentido quando os cards tiverem conteúdo rico; favoritar = seção "Pinned" no topo com card expandido
- Paginação da lista de repos — desnecessário com poucos repos
- `summaries.type` como pgEnum — issue futura

## Mockups aprovados

Referência visual para implementação (abrir no browser):

- [`mockups/empty-state.html`](mockups/empty-state.html) — Empty state com welcome + dashed CTA + ghost cards
- [`mockups/add-repo-modal.html`](mockups/add-repo-modal.html) — Modal com busca, checkboxes e botão batch
- [`mockups/dashboard-grid.html`](mockups/dashboard-grid.html) — Dashboard com grid de cards 2 colunas

## Frontend

### Fix do redirect

**Arquivo:** `apps/web/src/App.tsx`

O `signIn.social({ provider: 'github', callbackURL: '/' })` usa path relativo, que o BetterAuth resolve contra o `baseURL` do servidor (API). Fix: usar URL absoluta do frontend.

```typescript
signIn.social({
  provider: 'github',
  callbackURL: window.location.origin + '/',
})
```

### Empty state (sem repositórios)

Tela exibida quando o usuário logado não tem repos adicionados:

- Saudação personalizada: "Bem-vindo, {firstName}!"
- Subtítulo: "Seus repositórios e resumos aparecerão aqui."
- Card com borda dashed como CTA: "Comece adicionando um repositório" + botão "Adicionar repositório"
- Ghost cards (2, opacity baixa) indicando onde os repos vão aparecer

### Dashboard (com repositórios)

- Header: título "Seus repositórios" + contador ("N observados") + botão "+ Adicionar"
- Grid responsivo: 2 colunas em desktop, 1 em mobile (`sm:grid-cols-2`)
- Cada card:
  - Nome do repo: `owner/name` (font-weight 600)
  - Link "Ver no GitHub" (abre em nova aba)
  - Botão remover (✕) no canto superior direito
  - Data de adição ("Adicionado há X dias") usando formatação relativa

### Modal — Adicionar repositório

- Trigger: botão "+ Adicionar" (empty state ou header do dashboard)
- Conteúdo:
  - Título "Adicionar repositório" + botão fechar (✕)
  - Campo de busca com debounce (~400ms)
  - Lista de resultados: checkbox + nome (`owner/repo`) + metadata (stars, linguagem)
  - Repos já adicionados aparecem desabilitados com indicador "Já adicionado"
  - Botão no rodapé: "Adicionar N repositórios" (desabilitado se nenhum selecionado)
- Após confirmar: fecha o modal, atualiza a lista de repos no dashboard

### Confirmação de remoção

- Clicar no ✕ do card exibe confirm dialog nativo (`window.confirm`)
- Mensagem: "Remover {owner/repo} dos seus repositórios?"
- Se confirmar: chama DELETE, remove o card da lista

### Estrutura de componentes

O `App.tsx` atual tem tudo inline. Extrair para componentes:

```
apps/web/src/
├── App.tsx                    (router: login vs dashboard)
├── components/
│   ├── LoginCard.tsx          (tela de login com OAuth)
│   ├── Dashboard.tsx          (orquestra empty state vs lista)
│   ├── EmptyState.tsx         (CTA para adicionar primeiro repo)
│   ├── RepoGrid.tsx           (grid de cards)
│   ├── RepoCard.tsx           (card individual do repo)
│   └── AddRepoModal.tsx       (modal de busca + seleção)
├── lib/
│   └── auth-client.ts         (já existe)
```

## Backend

### Endpoints (todos protegidos pelo auth-guard)

**`GET /api/repositories/search?q=...`** — Proxy para GitHub Search API

- Busca o `access_token` do usuário na tabela `accounts` (via `userId` + `providerId = 'github'`)
- Chama `GET https://api.github.com/search/repositories?q={query}` com `Authorization: Bearer {token}`
- Retorna array de resultados formatados: `{ fullName, htmlUrl, description, stargazersCount, language }`
- Mínimo de 2 caracteres na query para disparar a busca

**`GET /api/repositories`** — Listar repos do usuário

- Filtra por `userId` da sessão
- Retorna todos os repos do usuário com campos do schema

**`POST /api/repositories`** — Adicionar repos

- Body: `{ repositories: [{ githubRepoName, githubRepoUrl }] }` (array para suportar batch)
- Valida duplicatas via unique index (`userId` + `githubRepoName`)
- Retorna os repos criados

**`DELETE /api/repositories/:id`** — Remover repo

- Valida que o repo pertence ao `userId` da sessão (evita deletar repo de outro usuário)
- Retorna 204 no sucesso

### Estrutura de arquivos

```
apps/api/src/routes/
├── auth.ts         (já existe)
├── health.ts       (já existe)
├── me.ts           (já existe)
└── repositories.ts (novo — todos os endpoints de repos)
```

Todos os endpoints de repositório em um único arquivo de rotas, registrado com auth-guard no escopo (padrão definido na issue #5).

## Verificação

1. **Fix redirect:** fazer login com GitHub → deve cair no frontend (`localhost:5173`), não no backend
2. **Empty state:** login com novo usuário sem repos → exibe saudação + CTA dashed + ghost cards
3. **Busca:** clicar em "Adicionar" → modal abre → digitar "react" → resultados aparecem com stars e linguagem
4. **Adicionar:** selecionar 2 repos → "Adicionar 2 repositórios" → modal fecha → repos aparecem no grid
5. **Dashboard:** repos exibidos em grid de cards com nome, link, remover, data
6. **Remover:** clicar ✕ → confirm → repo some da lista
7. **Duplicata:** tentar adicionar repo que já existe → aparece "Já adicionado" no modal
8. **Auth:** acessar endpoints sem sessão → 401
9. **Segurança:** tentar deletar repo de outro usuário → deve falhar
