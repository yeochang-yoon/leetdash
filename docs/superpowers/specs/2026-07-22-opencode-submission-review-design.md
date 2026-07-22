# OpenCode Submission Review Gate Design

## Context

Leetdash validates submission-only pull requests and a scheduled sweeper merges eligible requests after the `validate` check succeeds. The repository needs a second, fail-closed review gate that evaluates every changed `solution.*` against live LeetCode problem data before the sweeper can merge it.

Issue #33 fixes the external contract:

- OpenCode configuration model: `opencode-go/kimi-k2.7-code`
- OpenCode Go API model: `kimi-k2.7-code`
- Secret: `OPENCODE_API_KEY`
- Variable: `OPENCODE_REVIEW_MODEL`
- Required check: `opencode-review`
- Managed PR comment marker: `<!-- leetdash-opencode-review -->`

OpenCode Go exposes Kimi K2.7 Code through the OpenAI-compatible `https://opencode.ai/zen/go/v1/chat/completions` endpoint. The implementation calls this API directly from Node 20 rather than installing the OpenCode CLI or a third-party GitHub Action.

## Goals

- Review each added or modified `solution.*` in a validated submission-only pull request.
- Resolve the canonical problem from `data/problem-catalog.json` and fetch live problem context from LeetCode GraphQL.
- Require machine-validated schema version 1 JSON from the model.
- Block only correctness, compilation, runtime, termination, judge-contract, and constraint-breaking complexity defects.
- Maintain one bot-authored PR comment for the current head commit.
- Produce sanitized, stable infrastructure failures without leaking secrets, raw external responses, or unnecessary source code.
- Require both `validate` and `opencode-review` for automatic merging.

## Non-goals

- Persisting LeetCode statements or model responses in the repository, artifacts, or cross-run caches.
- Storing review history by commit or showing it in the application UI.
- Executing untrusted submitted code.
- Automatically retrying external requests inside one run. Retryability is reported so the workflow can be rerun safely.
- Reviewing `meta.json`, README files, or deleted files with the model.

## Architecture

### `scripts/opencode-review-core.mjs`

This module contains deterministic behavior and has no process-environment or GitHub side effects. It provides:

- submission path parsing and catalog resolution;
- source extension to LeetCode `langSlug` mapping;
- validation and normalization of LeetCode question data;
- full review prompt rendering;
- schema version 1 model-result parsing and invariant validation;
- Markdown rendering for PASS, code FAIL, and infrastructure-failure comments;
- sanitized operational failure construction and formatting.

The core module accepts plain objects and returns plain objects so tests can exercise all contracts without network access.

### `scripts/opencode-review.mjs`

This module contains orchestration and external clients:

- obtains changed files from the merge-base diff through the existing validator helper;
- reads the catalog and changed solution source files;
- fetches and caches LeetCode question data by canonical slug;
- calls the OpenCode Go chat-completions endpoint;
- creates and completes the explicit `opencode-review` check run;
- finds, creates, or updates the managed PR comment;
- appends the same sanitized result to `$GITHUB_STEP_SUMMARY`;
- exits nonzero for code FAIL or any review operational failure.

All external calls use injected `fetch` functions in tests. The CLI constructs real clients only in `main()`.

### GitHub Actions workflow

`.github/workflows/deploy-pages.yml` exposes `steps.pr-scope.outputs.submission_only` as a `validate` job output. A pull-request-only review job runs after a successful `validate` job with these permissions:

- `contents: read`
- `checks: write`
- `pull-requests: write`

The job always emits an explicit check named `opencode-review` for a valid pull request. For non-submission pull requests it completes the check successfully with a not-applicable summary and does not call LeetCode, OpenCode, or the comments API. This prevents the repository-wide required check from blocking ordinary application pull requests.

The Actions job itself has a different display name so it does not create a second check with the required context name.

## Data flow

1. The workflow passes the PR number, base SHA, head SHA, repository, workflow-run URL, and `submission_only` output to the review script.
2. The script creates an in-progress `opencode-review` check run for the exact head SHA.
3. For a non-submission PR, the script completes that check successfully and stops.
4. For a submission-only PR, the script computes `base...head` changed files using `--no-renames` and selects only added or modified files whose basename is `solution` and whose extension is supported by submission validation.
5. Each path is parsed as `submissions/<user>/<sourceKey>/<submissionKey>/solution.<extension>`.
6. The script finds `catalog.lists` entry `key === sourceKey`, then its item whose `submissionKey` matches, then the canonical `catalog.problems` entry for that item's slug.
7. The LeetCode client calls `https://leetcode.com/graphql` with `question(titleSlug: ...)`. A `Map<string, Promise<QuestionData>>` caches the request per slug, including concurrent requests.
8. The normalized question contains content with examples and constraints, example test cases, parsed judge metadata, the official code snippet matching the submission language, and topic tags.
9. The prompt includes the problem identity, all normalized live context, the exact repository path, language, and submitted source.
10. The OpenCode client strips the required `opencode-go/` configuration prefix and sends `kimi-k2.7-code` as the API `model` with temperature zero and JSON-only instructions.
11. The response must contain one assistant text content value. The script parses it as JSON and validates the schema and verdict invariants.
12. Results for all changed solutions are aggregated. Any code FAIL makes the check fail. Otherwise the check succeeds.
13. The script upserts one managed bot comment and completes the check with the same sanitized summary.

## LeetCode problem contract

The GraphQL query requests:

- `questionFrontendId`, `title`, `titleSlug`, `difficulty`, and `content`;
- `exampleTestcases`;
- `metaData`;
- `codeSnippets { lang, langSlug, code }`;
- `topicTags { name, slug }`.

The catalog remains authoritative for canonical ID, title, difficulty, and slug. Live GraphQL data supplies review context. A question is invalid when the response lacks nonempty content, example test cases, parseable judge metadata, or an official snippet for the submitted language.

Language mapping is explicit: `c -> c`, `cc/cpp -> cpp`, `cs -> csharp`, `dart -> dart`, `go -> golang`, `java -> java`, `js -> javascript`, `kt -> kotlin`, `php -> php`, `py -> python3`, `rb -> ruby`, `rs -> rust`, `scala -> scala`, `sql -> mysql`, `swift -> swift`, and `ts -> typescript`.

## Model-result contract

The top-level object contains exactly:

- `schema_version: 1`;
- `verdict: PASS | FAIL`;
- the exact requested `path`;
- `summary`;
- `correctness { status, reason }`;
- `complexity { time, space, acceptable, reason }`;
- `blocking_findings`;
- `non_blocking_suggestions`.

Each blocking finding contains a permitted blocking category, reason, evidence, and a counterexample object with nullable `input`, `expected`, and `actual`. Each non-blocking suggestion contains a permitted suggestion category and suggestion text. Unknown keys, missing keys, invalid types, empty required text, and unknown enum values invalidate the response.

PASS requires correctness PASS, acceptable complexity, and no blocking findings. FAIL requires correctness FAIL or unacceptable complexity and at least one blocking finding. Correctness, runtime, or platform-contract findings require a complete counterexample when one is applicable; compile, termination, and complexity findings may use null counterexample fields when a finite example cannot represent the defect.

## Failure model and redaction

Operational failures use one of these stages:

- `catalog-resolve`
- `problem-fetch`
- `problem-parse`
- `model-request`
- `model-response`
- `result-validation`

They use one of these reason codes:

- `CATALOG_MAPPING_FAILED`
- `PROBLEM_FETCH_FAILED`
- `PROBLEM_DATA_INVALID`
- `MODEL_REQUEST_FAILED`
- `MODEL_RESPONSE_INVALID`
- `REVIEW_RESULT_INVALID`

A safe failure includes only stage, reason code, a fixed human-readable detail, retryable yes/no, optional HTTP status, and optional external request ID. Status 408, 425, 429, and 5xx failures are retryable. Request IDs may be read from `x-request-id`, `request-id`, or `cf-ray`.

External response bodies, thrown fetch messages, request headers, environment variables, API keys, complete model output, and source code are never copied into a safe failure. Unexpected internal exceptions become a fixed stage-appropriate detail rather than using the raw exception message.

## Check and comment lifecycle

The explicit check run is created before external review work. Its output title and summary are updated on completion.

- All reviews PASS: conclusion `success` with per-path summaries and optional non-blocking suggestions.
- Any review FAIL: conclusion `failure` with blocking findings and counterexamples.
- Operational failure: conclusion `failure` with the sanitized infrastructure-failure block.
- Non-submission PR: conclusion `success` with a not-applicable summary.

The comment client lists PR issue comments and only manages a comment that both contains `<!-- leetdash-opencode-review -->` and was authored by `github-actions[bot]`. Marker-free comments and user-authored marker comments remain untouched. A previous infrastructure-failure comment is replaced by a successful review on rerun because the same bot comment is updated.

Comment delivery happens after the review verdict is known. If comment listing, creation, or update fails, the script preserves that verdict and records a fixed `GitHub review comment delivery failed` diagnostic with only an optional HTTP status and request ID in the explicit check output and `$GITHUB_STEP_SUMMARY`. This delivery diagnostic does not invent a seventh review stage or reason code and does not expose the GitHub response body. If creating or updating the check itself fails, the workflow job fails and the missing or incomplete required check continues to block merging.

## Sweeper integration

The sweeper accepts an ordered list of required checks instead of one check. Its default and workflow configuration are `validate,opencode-review`. Eligibility requires every named check run for the exact PR head SHA to have `status === completed` and `conclusion === success`.

The existing path ownership, catalog validation, draft, conflict, base branch, and exact merge SHA protections remain unchanged.

## Repository configuration and rollout

After implementation verification:

1. Create or update repository variable `OPENCODE_REVIEW_MODEL=opencode-go/kimi-k2.7-code`.
2. The repository owner adds `OPENCODE_API_KEY`; the implementation never receives or stores its value locally.
3. Run the workflow on a submission-only pull request and verify that an `opencode-review` check is emitted for its head SHA.
4. Update `master` branch protection to require both `validate` and `opencode-review` only after the secret exists and the new check has been observed. This ordering avoids locking all pull requests before the workflow can satisfy the new context.

Fork pull requests do not receive repository secrets under the `pull_request` event. They therefore fail closed without switching to `pull_request_target` or executing untrusted code with elevated privileges.

## Testing strategy

Unit and orchestration tests use temporary files and injected clients. They cover:

- successful catalog resolution and every supported extension mapping;
- missing list, item, problem, language snippet, content, metadata, and examples;
- one GraphQL request for multiple solutions with the same slug;
- inclusion of problem content, test cases, judge metadata, official template, tags, path, and source in the prompt;
- OpenCode configuration-model to API-model normalization;
- PASS and FAIL schema validation, path equality, invariant conflicts, and counterexamples;
- each stable stage and reason code plus retryability and request-ID extraction;
- raw secret, authorization, response body, model output, and source-code exclusion from logs and rendered failures;
- managed-comment creation, update, marker spoof preservation, failure-to-success replacement, and API-failure fallback;
- exact-head check creation and completion;
- successful no-op behavior for non-submission pull requests;
- sweeper acceptance only when both required checks succeed;
- workflow outputs, permissions, environment variables, and required check names.

The complete existing test suite, typecheck, and production build run before completion. A live LeetCode read-only smoke request may verify the current GraphQL shape, but automated tests do not depend on external services.

## Acceptance criteria

- Every changed solution receives live problem context and a schema-validated review.
- Same-slug solutions cause one GraphQL request per workflow run.
- Code failures show blocking findings and applicable counterexamples.
- Catalog, GraphQL, OpenCode, model JSON, and result-validation failures block merging with sanitized diagnostics. Comment delivery failures preserve the completed review verdict and leave sanitized diagnostics in the check and Actions summary.
- A successful rerun replaces the existing managed failure comment.
- The sweeper never merges without successful `validate` and `opencode-review` checks for the current head SHA.
- No secret, authorization material, raw external response, complete model output, or unnecessary source code appears in comments, check output, Actions summary, or logs.
