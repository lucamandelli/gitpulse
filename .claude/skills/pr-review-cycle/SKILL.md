---
name: pr-review-cycle
description: Use AUTOMATICALLY whenever implementation of a feature/fix is complete and the user asks to open/create a PR (signals include "abrir PR", "criar PR", "finalizar feature", "push and open PR", "open the PR"). Orchestrates the full cycle — create PR, request @claude review, poll adaptively, address feedback, merge, document — in the same conversation to preserve implementation context. Do not open PRs manually; always route through this skill.
---

# PR Review Cycle

## Overview

Automate the full PR lifecycle after finishing a feature: create PR → request @claude review → poll for feedback → fix/discuss → merge → document. Runs in the **same conversation** to preserve 100% of implementation context.

**Core principle:** The Claude that built the feature is the same Claude that defends, corrects, and documents it.

**Announce at start:** "Using pr-review-cycle skill to create PR, get review from @claude, and merge."

## When to invoke (MANDATORY triggers)

Invoke this skill — do NOT open a PR manually — whenever any of these happen:

- User says "vamos abrir o PR", "criar PR", "push and open PR", "finalizar a feature", "open the PR", or equivalent
- You just finished implementing a feature/fix on a non-main branch and the user signals completion ("pronto", "tá bom", "feito", "done", "ready")
- You are about to run `gh pr create` for any reason

If you catch yourself about to run `gh pr create` directly, STOP and invoke this skill instead.

## The Rationalization Trap

| Rationalization | Reality |
|---|---|
| "I'll just accept all review comments" | You have context the reviewer doesn't. Defend architectural decisions when they're right. |
| "The review is taking too long, skip polling" | @claude typically responds in 1–3 min. If > 10 min without response, escalate. Patience preserves quality. |
| "CI is probably fine, merge anyway" | CI failures after merge create more work than waiting. |
| "I'll document later" | Post-merge documentation uses hot context. Later means never. |
| "5 cycles is too many, escalate early" | Each cycle makes the code better. Use all 5 before giving up. |

## The Process

### Step 1: Preparation

1. Identify the current branch, repo (`owner/repo`), and linked issue:
   - Extract issue number from branch name (e.g., `feature/issue-6-repos-rest-routes` → `#6`)
   - If not extractable, ask the user
2. Run the project's test suite (if configured):
   ```bash
   npm test / npm run test / cargo test / pytest / go test ./...
   ```
3. **If tests fail → STOP.** Fix failures before proceeding. Do not create a PR with failing tests.
4. Push the branch:
   ```bash
   git push -u origin <branch>
   ```

### Step 2: Create PR

```bash
gh pr create --base develop --title "<concise title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets describing what was implemented>

## Related Issue
Closes #<issue-number>

## Test Plan
- [ ] <verification steps>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Capture the PR number from the output.

### Step 3: Request review

```bash
gh pr comment <number> --body "@claude please review this PR"
```

Initialize cycle counter: `review_cycle = 0`

### Step 4: Measure PR size, then poll

Right after requesting review (Step 3), measure PR size once:

```bash
gh pr view <number> --json additions,deletions,changedFiles
```

Let `loc = additions + deletions` and `files = changedFiles`. Classify:

| Size | Criteria | First wait | Subsequent wait |
|---|---|---|---|
| **Small** | files < 5 AND loc < 200 | 60s | 60s |
| **Medium** | files < 15 AND loc < 800 | 90s | 90s |
| **Large** | files ≥ 15 OR loc ≥ 800 | 120s | 120s |

Use `ScheduleWakeup` with the delay matching the current poll:

- **First check after requesting review:** first-wait from table above
- **Subsequent checks (no review yet):** subsequent-wait from table above
- **After pushing fixes + re-requesting review:** first-wait from table above (reset)

**Rationale for values:** All values ≤ 120s stay comfortably inside the 5-min prompt cache TTL — keeping multiple checks cheap. Observed real-world data: @claude finishes in ~60s for small PRs and ~2 min for medium/large ones. Do not use 300s — it's the worst-of-both (cache miss without enough amortization).

If after **6 polls in a single review round** there is still no review, fall back to `delaySeconds: 1200` once, then escalate to the user if still nothing.

The `ScheduleWakeup` prompt must instruct to continue at Step 5.

### Step 5: Check review status

**Important:** the `@claude` GitHub App always posts as an **issue comment**, never as a formal review. Do NOT check `/pulls/{number}/reviews` — it will always be empty.

```bash
# Get all PR comments and find the latest from @claude
gh pr view <number> --json comments --jq '
  [.comments[] | select(.author.login == "claude")]
  | sort_by(.createdAt)
  | .[-1]
'
```

Parse the result:

| Condition | Action |
|---|---|
| No comment from `claude` exists | Bot hasn't picked up the job yet → return to Step 4 |
| Comment body does NOT start with `"**Claude finished"` | Bot still working (editing comment in-progress) → return to Step 4 |
| Comment body starts with `"**Claude finished"` | Review complete → parse verdict (Step 5b) |

**Step 5b — parse verdict from completed comment body:**

| Body contains | Verdict | Go to |
|---|---|---|
| "Approved" / "Aprovado" / "✅" / "✓" near "Verdict"/"Veredito" | APPROVED | Step 8 |
| "Changes requested" / "request changes" / critical observations | CHANGES_REQUESTED | Step 6 |
| Observations only, no blocking request | COMMENTED | Step 6 |

### Step 6: Process review comments

The `@claude` GitHub App writes the full review (observations, suggestions, verdict) in a single issue comment body. Read it directly from Step 5's result.

```bash
# Also check for any inline review comments (rare, but possible)
gh api repos/{owner}/{repo}/pulls/{number}/comments

# Re-read the full @claude comment body if needed
gh pr view <number> --comments
```

For **each unaddressed observation**, evaluate and decide:

| Situation | Action |
|---|---|
| Clear, correct suggestion | Apply the fix in code |
| Real bug identified | Fix immediately |
| Conflicts with an architectural decision made during implementation | Reply explaining context: `gh pr comment <N> --body "@claude <explanation>"` |
| Ambiguous or unclear suggestion | Reply asking for clarification: `gh pr comment <N> --body "@claude <question>"` |

**Important:** Do NOT blindly accept every suggestion. You have the full implementation context — use it to make informed decisions about what to change and what to defend.

### Step 7: Push fixes and re-request review

After processing all comments:

```bash
# Stage and commit fixes
git add <modified files>
git commit -m "fix: address review comments from cycle <N>"
git push

# Request re-review
gh pr comment <number> --body "@claude changes applied, see inline replies for discussions. Please re-review."
```

Increment cycle counter: `review_cycle += 1`

**If `review_cycle >= 5`** → go to Escalation (below)

Otherwise → return to Step 4 (poll for next review)

### Step 8: Verify CI and merge

```bash
# Check CI status
gh pr checks <number>
```

- **All checks passing** (or no checks configured) → proceed to merge
- **Checks failing** → attempt to fix the failure, commit, push, return to Step 4

```bash
gh pr merge <number> --squash --delete-branch
```

### Step 9: Post-merge documentation

Invoke the `documenting-merged-prs` skill:

1. The skill writes a technical record on the linked issue
2. Creates new issues for any out-of-scope problems found during implementation
3. Closes the original issue

```
Skill("documenting-merged-prs")
```

**Done.** Report to the user: PR merged, issue documented and closed.

## Escalation (cycle >= 5)

If after 5 review cycles the @claude GitHub App has not approved:

```
⚠️ Reached the limit of 5 review cycles without approval from @claude.

Review history:
- Cycle 1: [summary of changes and discussions]
- Cycle 2: [...]
- ...

Pending disagreements:
- [list of unresolved points with context]

I need your intervention to decide how to proceed.
```

Wait for user instructions before taking any further action.

## Quick Reference

| Step | Action | Command |
|---|---|---|
| 1 | Run tests + push | `npm test && git push -u origin <branch>` |
| 2 | Create PR | `gh pr create --base develop` |
| 3 | Request review | `gh pr comment <N> --body "@claude ..."` |
| 4 | Measure size + poll | `gh pr view --json additions,deletions,changedFiles` + `ScheduleWakeup(60–120s)` |
| 5 | Check status | `gh pr view <N> --json comments` → filter `author.login == "claude"` → check `"**Claude finished"` |
| 6 | Process comments | Read @claude comment body + fix/reply |
| 7 | Push fixes | `git push` + re-request review |
| 8 | Merge | `gh pr merge <N> --squash --delete-branch` |
| 9 | Document | `Skill("documenting-merged-prs")` |

## Common Mistakes

**Checking `/pulls/{number}/reviews` for the @claude review**
The `@claude` GitHub App in this setup NEVER posts a formal review — it always posts as an issue comment. The `/reviews` endpoint returns `[]` every time. Always use `gh pr view <N> --json comments` and filter by `author.login == "claude"`.

**Treating an in-progress comment as a completed review**
The bot creates its comment immediately (~15–25s) and edits it while working. Only a body starting with `"**Claude finished"` means the review is done. If that prefix isn't there, keep polling.

**Accepting every review comment blindly**
You implemented the feature — you know why decisions were made. The @claude reviewer sees only the diff. Defend decisions that are correct, fix actual problems.

**Not pushing before creating PR**
Always `git push -u origin <branch>` before `gh pr create`. The PR needs the remote branch to exist.

**Polling with fixed 240s regardless of PR size**
@claude completes most reviews in 60–130s. Always measure size once (Step 4) and pick delay from the size table. 60s is sufficient for small PRs; 120s covers even large ones.

**Opening a PR without invoking this skill**
If the user says "abrir PR" / "criar PR" / "finalizar feature", this skill MUST orchestrate the flow. Running `gh pr create` manually skips the review cycle and loses the in-conversation context for addressing @claude's feedback.

**Skipping CI verification before merge**
Even if review is approved, CI must pass. A merged PR with failing CI breaks `develop` for everyone.

**Forgetting to call documenting-merged-prs**
The documentation skill uses the hot context from this session. Skipping it means the technical record never gets written, or gets written later without the implementation context.

## Integration

**Pairs with:**
- **documenting-merged-prs** — Called in Step 9 after merge to write technical record and close issue
- **finishing-a-development-branch** — This skill replaces Option 2 (Push and Create PR) with a fully automated review cycle
