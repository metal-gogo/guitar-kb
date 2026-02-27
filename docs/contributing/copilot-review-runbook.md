# Copilot Review Retrigger and Recovery Runbook

Use this runbook when `require-copilot-review` is failing, pending, duplicated, or stale.
It is aligned with `planning/prompts/autonomous-maintenance.md`.

---

## 1) Baseline PR Status Check

Run these first to understand the current gate state:

```bash
gh pr view <PR_NUMBER> --json mergeStateStatus,mergeable,statusCheckRollup,reviews
gh api graphql -f owner='metal-gogo' -f repo='guitar-kb' -F number=<PR_NUMBER> \
  -f query='query($owner:String!,$repo:String!,$number:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$number){reviewThreads(first:100){nodes{id isResolved path line comments(first:20){nodes{author{login} body url createdAt}}}}}}}'
```

Merge readiness requires all of the following:

- no unresolved review threads
- green `build`
- green `require-copilot-review` checks
- `mergeStateStatus` not blocked by conflicts/behind state

---

## 2) Polling Behavior (No Review Yet)

If Copilot comments have not appeared yet:

- poll at a strict 1-minute interval (no faster)
- do not merge before Copilot review completion
- continue other issue work between polls

Example poll:

```bash
sleep 65
gh pr view <PR_NUMBER> --json statusCheckRollup,reviews,mergeStateStatus
```

---

## 3) Addressing Copilot Threads

For each Copilot thread:

1. apply code/docs change if actionable
2. push branch
3. reply on thread with what changed
4. resolve thread

Reply + resolve via GraphQL:

```bash
gh api graphql -f threadId='<THREAD_ID>' -f body='Applied in follow-up commit ...' \
  -f query='mutation($threadId:ID!,$body:String!){addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$threadId,body:$body}){comment{id}}}'

gh api graphql -f threadId='<THREAD_ID>' \
  -f query='mutation($threadId:ID!){resolveReviewThread(input:{threadId:$threadId}){thread{id isResolved}}}'
```

Re-check unresolved count:

```bash
gh api graphql -f owner='metal-gogo' -f repo='guitar-kb' -F number=<PR_NUMBER> \
  -f query='query($owner:String!,$repo:String!,$number:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$number){reviewThreads(first:100){nodes{isResolved}}}}}' \
  --jq '{unresolved_count: ([.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved==false)] | length)}'
```

---

## 4) Stale/Pending Copilot Request Recovery

Common failure mode in this repo:

- `require-copilot-review` fails with: `Copilot review has been requested and is still pending`
- `requested_reviewers` still contains `Copilot` even after previous comments

Check requested reviewers:

```bash
gh api repos/metal-gogo/guitar-kb/pulls/<PR_NUMBER> --jq '{requested_reviewers:[.requested_reviewers[]? | {login,type}]}'
```

Clear stale pending request:

```bash
gh api -X DELETE repos/metal-gogo/guitar-kb/pulls/<PR_NUMBER>/requested_reviewers -f 'reviewers[]=Copilot'
```

This should trigger a fresh `pull_request_target` run of `require-copilot-review`.

Inspect failed run reason when needed:

```bash
gh run list --workflow "Copilot Review" --branch <PR_BRANCH> --limit 5 --json databaseId,status,conclusion,createdAt,url
gh run view <RUN_ID> --log-failed
```

---

## 5) Re-trigger Confirmation After Push

After every push to a PR branch, confirm check re-trigger:

```bash
gh run list --workflow "CI" --branch <PR_BRANCH> --limit 3 --json databaseId,status,conclusion,createdAt,url
gh run list --workflow "Copilot Review" --branch <PR_BRANCH> --limit 5 --json databaseId,status,conclusion,createdAt,event,url
```

Do not merge until updated check runs are complete and green.

---

## 6) No-Comment Review Merge Checklist

If Copilot review completes with no actionable comments:

1. confirm unresolved thread count is 0
2. run local gates:

```bash
npm run lint
npm test
npm run build
npm run validate
```

3. confirm PR checks green and branch up to date
4. merge PR
5. close linked issue (if not auto-closed)
6. verify branch deletion

---

## References

- `planning/prompts/autonomous-maintenance.md`
- `.github/workflows/copilot-review.yml`
- `.github/workflows/ci.yml`
