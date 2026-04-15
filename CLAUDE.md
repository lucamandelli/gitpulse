# GitPulse — Instruções para Claude

## Fluxo de Git

- **Nunca trabalhar diretamente nas branches `main` ou `develop`.** Sempre criar uma feature branch antes de começar qualquer trabalho.
- **Commits atômicos obrigatórios.** Cada commit deve representar uma única mudança lógica, garantindo um histórico claro e rastreável do que está sendo desenvolvido.
- **PRs de feature branches sempre para `develop`, nunca para `main`.** A `main` reflete apenas o que está estável e funcional em produção; a `develop` é a branch de integração.
- **Nunca abrir PR sem que o usuário informe explicitamente.** Mesmo que a implementação esteja concluída, aguardar instrução antes de criar qualquer pull request.

## Skills e MCPs

- **Sempre verificar skills e MCPs disponíveis antes de iniciar qualquer desenvolvimento.** Antes de escrever código ou executar tarefas, verificar se existe alguma skill relevante (via ferramenta `Skill`) ou MCP que possa auxiliar — como `superpowers:brainstorming`, `superpowers:writing-plans`, `context7-mcp`, `frontend-design`, entre outros.
- **Prioridade de uso:** skills de processo primeiro (brainstorming, debugging, planejamento), depois skills de implementação (frontend-design, claude-api, etc.).
