---
name: documenting-merged-prs
description: Use when a PR has been merged and the related GitHub issue needs a technical record written before closing — architectural decisions, problems found and resolved, and out-of-scope problems as new issues
---

# Documenting Merged PRs

## Overview

Write a structured technical record on the related issue after a PR merges. The record is for **future reference** — not for the current team.

**Core principle:** The code ships once. The documentation ships with it. Problems out of scope become new issues, never just notes.

## The Rationalization Trap

**Before writing anything, recognize these rationalizations:**

| Rationalization | Reality |
|---|---|
| "The team already knows" | Future Claude doesn't. Future developers don't. You in 6 months don't. |
| "Keep it brief, next issue is waiting" | A 5-minute record prevents hours of re-investigation later. |
| "The PR review already has this" | PR comments are ephemeral. Issues are the permanent record. |
| "It was a minor problem, not worth documenting" | Minor problems that were caught are the most valuable to document. |
| "I'll mention it in notes" | If it needs fixing, it needs its own issue. Notes get ignored. |

## The Process

### Step 1: Gather context

```bash
# Commits on the feature branch
git log <base-branch>..<feature-branch> --oneline

# PR review comments
gh pr view <number> --repo <owner/repo> --comments
```

Recall from the session: every decision made, every problem hit, every tradeoff discussed.

### Step 2: Write technical record

> ⚠️ **Never include `@claude` in the issue comment body.** Mentioning the GitHub Claude App triggers an unwanted review on the issue comment itself — review on issues is not part of this workflow and only adds noise/cost. The record is documentation for humans + future Claude sessions, not a review request.

Post a comment with `gh issue comment <number> --repo <owner/repo> --body "..."` structured exactly as:

---

**## Registro técnico — implementação concluída**

**### O que foi entregue**

Table with one row per file created or modified:

```
| Arquivo | Responsabilidade |
|---|---|
| path/to/file.ts | What this file does |
```

**### Decisões arquiteturais**

Each decision must have a **why**. No decision without rationale.

```
**Decision name**
What was chosen and why — the constraint, tradeoff, or rejected alternative.
```

**### Problemas encontrados e resolvidos**

Each problem must have: symptom + root cause + solution.

```
#### N. Problem title
What the symptom was. Root cause. How it was resolved.
```

**### Notas para issues futuras**

Observations, known limitations, patterns to follow. Reference any new issues created here.

---

### Step 3: Handle out-of-scope problems

For every problem that was **identified but not fixed** (out of scope, unrelated, pre-existing):

**Do NOT just mention it in notes.** Create a new issue:

```bash
gh issue create --repo <owner/repo> \
  --title "<title>" \
  --body "$(cat <<'EOF'
## Descrição
<what the problem is>

## Tarefas
- [ ] <specific task>

## Critérios de aceite
- <acceptance criterion>

## Dependências
<if any>
EOF
)"
```

Then reference the new issue number in the notes section.

### Step 4: Close the issue

```bash
gh issue close <number> --repo <owner/repo>
```

## Quick Reference

| Section | Must contain |
|---|---|
| O que foi entregue | File + responsibility table |
| Decisões arquiteturais | Decision + **why** (not just what) |
| Problemas encontrados | Symptom + root cause + solution |
| Notas para issues futuras | Observations + new issue refs |

## Common Mistakes

**Writing what, not why**
"Used onConflictDoNothing" with no explanation → useless. Write: "Used onConflictDoNothing instead of SELECT+INSERT because the pre-check had a race condition between the read and write under concurrent requests."

**Leaving out-of-scope problems in notes**
"pagination not implemented (future)" → wrong. Create the issue, reference it in notes.

**Skipping problems caught in review**
A bug caught in spec review is still a bug. Document it — it reveals what the implementation got wrong the first time.

**One-paragraph summary instead of structured sections**
The structure is the value. Future reference requires sections, not prose.

**Mentioning `@claude` in the issue comment**
Triggers a GitHub App review on the issue, which is unnecessary — this is a post-merge documentation step, not a review request. If you need to link back to PR review discussions, reference the PR number (`#<N>`) without the `@claude` handle.
