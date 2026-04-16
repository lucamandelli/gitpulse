# GitPulse — Instruções para Claude

## Fluxo de Git

- **Nunca trabalhar diretamente nas branches `main` ou `develop`.** Sempre criar uma feature branch antes de começar qualquer trabalho.
- **Commits atômicos obrigatórios.** Cada commit deve representar uma única mudança lógica, garantindo um histórico claro e rastreável do que está sendo desenvolvido.
- **PRs de feature branches sempre para `develop`, nunca para `main`.** A `main` reflete apenas o que está estável e funcional em produção; a `develop` é a branch de integração.

## Skills e MCPs

- **Sempre verificar skills e MCPs disponíveis antes de iniciar qualquer desenvolvimento.** Antes de escrever código ou executar tarefas, verificar se existe alguma skill relevante (via ferramenta `Skill`) ou MCP que possa auxiliar — como `superpowers:brainstorming`, `superpowers:writing-plans`, `context7-mcp`, `frontend-design`, entre outros.
- **Prioridade de uso:** skills de processo primeiro (brainstorming, debugging, planejamento), depois skills de implementação (frontend-design, claude-api, etc.).

## Context7 — Boas Práticas das Stacks

- **Sempre consultar o Context7 antes de implementar qualquer feature.** Para cada stack envolvida (ex: Fastify, React, Prisma, Vite, Docker, etc.), usar o MCP `context7` para buscar a documentação atualizada e garantir que o código segue as melhores práticas e padrões de clean code da stack.
- **Sequência obrigatória:** `resolve-library-id` com o nome da biblioteca → `query-docs` com a pergunta específica → aplicar o que foi encontrado na implementação.
- **Não assumir conhecimento prévio das APIs.** Mesmo para bibliotecas familiares, consultar o Context7 para garantir que está usando a versão correta e as APIs mais recentes — o treinamento pode estar desatualizado.

## Convenções de Código

- **Sempre usar path aliases (`@/*`) para imports cross-diretório no `apps/api`.** Imports como `../lib/auth` ou `../../config/env` devem usar `@/lib/auth`, `@/config/env`, etc. Manter `./` apenas para imports no mesmo diretório (mesmo nível de arquivo), sempre com extensão `.js` (ex: `./app.js`, `./client.js`).
- **Build: sempre usar `npm run build` (nunca `tsc` diretamente).** O `tsc-alias` é necessário para resolver os path aliases `@/*` no output compilado — `tsc` sozinho gera ESM inválido para Node.js.
