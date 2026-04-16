# PR Review Cycle — Design Spec

## Context

Quando o Claude CLI termina de implementar uma feature/issue, o workflow atual exige passos manuais: abrir PR, solicitar review, esperar feedback, aplicar correções, mergear e documentar. Este processo pode ser totalmente automatizado mantendo o contexto completo da implementação.

**Problema:** O ciclo de PR review é repetitivo e manual. O Claude CLI já possui todo o contexto da feature desenvolvida — sabe o porquê de cada decisão — mas esse contexto se perde se o workflow for delegado a um agente separado.

**Solução:** Uma skill (`pr-review-cycle`) que orquestra todo o ciclo na mesma conversa, usando `ScheduleWakeup` para polling do review status, preservando 100% do contexto.

## Skill: `pr-review-cycle`

**Localização:** `.claude/skills/pr-review-cycle/SKILL.md`

**Quando usar:** Após concluir a implementação de uma feature/issue, quando o código está pronto para review e merge.

## Fluxo Completo

```
Feature concluída
    │
    ▼
[1] Verificar testes → Push branch → Criar PR para develop
    │
    ▼
[2] Comentar no PR: "@claude please review this PR"
    │
    ▼
[3] ScheduleWakeup (~120s) — polling
    │
    ▼
[4] Checar status do review via gh api
    │
    ├─ Sem review ainda → volta para [3]
    │
    ├─ CHANGES_REQUESTED →
    │   ├─ Ler cada comentário inline
    │   ├─ Para cada comentário:
    │   │   ├─ CONCORDA → aplica a correção
    │   │   └─ DISCORDA/DÚVIDA → responde inline no GitHub
    │   │       "@claude [explicação/questionamento]"
    │   ├─ Commit + push das correções aceitas
    │   ├─ Comentar "@claude changes applied, see inline replies for discussions"
    │   ├─ ciclo++ (máx 5)
    │   │   ├─ < 5 → volta para [3]
    │   │   └─ >= 5 → ESCALAR para usuário
    │
    └─ APPROVED →
        ├─ Checar CI checks
        │   ├─ CI passando → [5] Merge
        │   └─ CI falhando → fix CI → push → volta para [3]
        │
        ├─ [5] gh pr merge --squash --delete-branch
        └─ [6] Invocar skill documenting-merged-prs
```

## Detalhes de Implementação

### Step 1: Preparação e criação do PR

1. Rodar test suite do projeto (se existir)
2. Se testes falharem → parar e corrigir antes de prosseguir
3. Push da branch: `git push -u origin <branch>`
4. Criar PR:
   ```bash
   gh pr create --base develop --title "<título>" --body "$(cat <<'EOF'
   ## Summary
   <bullets do que foi implementado>

   ## Related Issue
   Closes #<issue-number>

   ## Test Plan
   - [ ] <verificações>

   🤖 Generated with Claude Code
   EOF
   )"
   ```

### Step 2: Solicitar review

```bash
gh pr comment <number> --body "@claude please review this PR"
```

### Step 3: Polling via ScheduleWakeup

- **Primeiro check:** ~120s (dar tempo ao @claude de processar)
- **Checks subsequentes:** ~180s (dentro do cache window de 5min)
- **Após fix + re-review:** ~120s novamente

Usar `ScheduleWakeup` com prompt que repete o ciclo de checagem.

### Step 4: Processar review

**Detectar status:**
```bash
# Listar reviews
gh api repos/{owner}/{repo}/pulls/{number}/reviews

# Último review state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED"
```

**Ler comentários inline:**
```bash
gh api repos/{owner}/{repo}/pulls/{number}/comments
# Cada comentário: path, line, body, id, in_reply_to_id
```

**Estratégia de decisão por comentário:**

| Situação | Ação |
|---|---|
| Sugestão clara e correta | Aplicar correção no código |
| Bug real apontado | Corrigir imediatamente |
| Conflita com decisão arquitetural da implementação | Responder inline explicando o contexto e a decisão |
| Dúvida / sugestão ambígua | Responder inline pedindo clarificação ao @claude |

**Responder a comentário inline:**
```bash
gh api repos/{owner}/{repo}/pulls/{number}/comments \
  --method POST \
  -f body="@claude <resposta>" \
  -F in_reply_to=<comment_id>
```

**Após processar todos os comentários:**
```bash
# Commit e push das correções
git add <arquivos modificados>
git commit -m "fix: address review comments from cycle N"
git push

# Comentar pedindo re-review
gh pr comment <number> --body "@claude changes applied, see inline replies for discussions. Please re-review."
```

### Step 5: Merge

**Condições:**
- Review state = `APPROVED`
- Todos CI checks passando (ou sem checks configurados)

```bash
gh pr merge <number> --squash --delete-branch
```

### Step 6: Documentação pós-merge

**Identificar a issue vinculada:** Extrair do body do PR (campo "Closes #N") ou do nome da branch (ex: `feature/issue-6-repos-rest-routes` → issue #6).

Invocar a skill `documenting-merged-prs` que:
1. Escreve registro técnico na issue vinculada (usando o contexto completo da sessão)
2. Cria issues para problemas out-of-scope encontrados durante a implementação
3. Fecha a issue original

### Escalação (ciclo >= 5)

Se após 5 ciclos de review o @claude não aprovou:

```
⚠️ Atingi o limite de 5 ciclos de review sem aprovação do @claude.

Resumo do histórico:
- Ciclo 1: [resumo das mudanças e discussões]
- Ciclo 2: [...]
- ...

Divergências pendentes:
- [lista dos pontos não resolvidos]

Preciso da sua intervenção para decidir como prosseguir.
```

## Arquivos a criar/modificar

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `.claude/skills/pr-review-cycle/SKILL.md` | Criar | Skill principal com todo o workflow |

## Verificação

1. Criar uma branch de teste com uma mudança trivial
2. Invocar a skill `pr-review-cycle`
3. Verificar que o PR é criado corretamente para `develop`
4. Verificar que o comentário com `@claude` é postado
5. Verificar que o polling funciona e detecta reviews
6. Verificar que correções são aplicadas e pushed
7. Verificar que o merge acontece quando aprovado
8. Verificar que `documenting-merged-prs` é invocada após o merge
