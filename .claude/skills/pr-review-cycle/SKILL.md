---
name: pr-review-cycle
description: Use when a feature/issue implementation is complete and ready for PR creation, automated review cycle with @claude GitHub App, and merge. Orchestrates the full cycle in the same conversation to preserve implementation context.
---

# PR Review Cycle

## Overview

Automate the full PR lifecycle after finishing a feature: create PR → request @claude review → poll for feedback → fix/discuss → merge → document. Runs in the **same conversation** to preserve 100% of implementation context.

**Core principle:** The Claude that built the feature is the same Claude that defends, corrects, and documents it.

**Announce at start:** "Using pr-review-cycle skill to create PR, get review from @claude, and merge."

## The Rationalization Trap

| Rationalization | Reality |
|---|---|
| "I'll just accept all review comments" | You have context the reviewer doesn't. Defend architectural decisions when they're right. |
| "The review is taking too long, skip polling" | The @claude GitHub App needs time. Patience preserves quality. |
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

### Step 4: Poll for review

Use `ScheduleWakeup` to wait before checking:

- **First check after requesting review:** `delaySeconds: 120`
- **Subsequent checks (no review yet):** `delaySeconds: 180`
- **After pushing fixes + re-requesting:** `delaySeconds: 120`

The `ScheduleWakeup` prompt must instruct to continue at Step 5.

### Step 5: Check review status

```bash
# Get all reviews on the PR
gh api repos/{owner}/{repo}/pulls/{number}/reviews
```

Parse the **most recent review** (last in array). Check `state` field:

- **No reviews yet** → return to Step 4 (continue polling)
- **`COMMENTED`** → read the comments (go to Step 6), they may contain actionable feedback
- **`CHANGES_REQUESTED`** → go to Step 6
- **`APPROVED`** → go to Step 8

### Step 6: Process review comments

```bash
# Get inline review comments
gh api repos/{owner}/{repo}/pulls/{number}/comments

# Get general PR comments (for non-inline feedback)
gh pr view <number> --comments
```

For **each unaddressed comment**, evaluate and decide:

| Situation | Action |
|---|---|
| Clear, correct suggestion | Apply the fix in code |
| Real bug identified | Fix immediately |
| Conflicts with an architectural decision made during implementation | Reply inline explaining the context and reasoning: `gh api repos/{owner}/{repo}/pulls/{number}/comments --method POST -f body="@claude <explanation>" -F in_reply_to=<comment_id>` |
| Ambiguous or unclear suggestion | Reply inline asking for clarification: `gh api repos/{owner}/{repo}/pulls/{number}/comments --method POST -f body="@claude <question>" -F in_reply_to=<comment_id>` |

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
| 4 | Poll | `ScheduleWakeup(120-180s)` |
| 5 | Check status | `gh api repos/.../pulls/<N>/reviews` |
| 6 | Process comments | Read + fix/reply |
| 7 | Push fixes | `git push` + re-request review |
| 8 | Merge | `gh pr merge <N> --squash --delete-branch` |
| 9 | Document | `Skill("documenting-merged-prs")` |

## Common Mistakes

**Accepting every review comment blindly**
You implemented the feature — you know why decisions were made. The @claude reviewer sees only the diff. Defend decisions that are correct, fix actual problems.

**Not pushing before creating PR**
Always `git push -u origin <branch>` before `gh pr create`. The PR needs the remote branch to exist.

**Polling too aggressively**
The @claude GitHub App needs time to analyze the PR. First check at 120s minimum. Don't burn cache with 60s polls.

**Skipping CI verification before merge**
Even if review is approved, CI must pass. A merged PR with failing CI breaks `develop` for everyone.

**Forgetting to call documenting-merged-prs**
The documentation skill uses the hot context from this session. Skipping it means the technical record never gets written, or gets written later without the implementation context.

## Integration

**Pairs with:**
- **documenting-merged-prs** — Called in Step 9 after merge to write technical record and close issue
- **finishing-a-development-branch** — This skill replaces Option 2 (Push and Create PR) with a fully automated review cycle
