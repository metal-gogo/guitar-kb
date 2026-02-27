# Issue: Coverage Gate Enforcement in Validate and CI

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/ci-test`

**Depends on**: #037 — requires explicit coverage matrix contract
**Depends on**: #042 — enforcement must operate on stable normalized quality mapping
**Depends on**: #049 — full voicing and quality ingestion baseline should be completed first

## Summary

Promote root-quality coverage from informational logs to a policy gate with
deterministic pass/fail behavior in local validate runs and CI.

## Scope

- Add configurable coverage gate rules in validate (for example:
  strict full-matrix mode and temporary allowlist-based exceptions).
- Emit machine-readable coverage report artifact (`json`) in a deterministic form.
- Wire CI to persist the coverage artifact and fail when gate policy is violated.
- Document gate configuration and default policy in `README.md`.

## Acceptance Criteria

- [ ] `npm run validate` enforces the configured coverage policy deterministically.
- [ ] Coverage artifact is generated with stable field ordering/content.
- [ ] CI fails when policy is violated and uploads coverage artifact on every run.
- [ ] Default gate policy requires full defined-quality matrix coverage (or explicit allowlist entries).
- [ ] `npm test -- test/unit/coverage.test.ts test/unit/schema.test.ts` exits `0`.
- [ ] `npm run validate` exits `0` only when full matrix policy is satisfied.
- [ ] `env VALIDATE_REQUIRE_FULL_MATRIX=1 npm run validate` exits non-zero in local negative test when matrix gaps exist.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm test -- test/unit/coverage.test.ts test/unit/schema.test.ts
npm run validate
env VALIDATE_REQUIRE_FULL_MATRIX=1 npm run validate
```

Expected outcome:
- First two commands exit `0`.
- The final command exits non-zero and prints a clear coverage gate failure reason.
