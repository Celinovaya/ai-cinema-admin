# Week 7 implementation and acceptance checks

This extends the existing AI Cinema Admin project. No schema migrations, environment changes, additional dependencies, commits, or pushes are required.

## Requirements and routes

| Requirement | Route | Table | Operations |
| --- | --- | --- | --- |
| 1 | `/users` | `profiles` | Existing read-only user list |
| 2 | `/admin/prompt-chains` | `prompt_chains` | Read |
| 3 | `/admin/prompt-chain-steps` | `prompt_chain_steps` | Read, ordered by chain and step |
| 4 | `/admin/prompt-chain-mix` | `prompt_chain_mix` | Read, update weight and active status |
| 5 | `/admin/terms` | `terms` | Create, read, update, delete |
| 6 | `/generations` | `generations` | Existing generated-text viewer and CRUD |
| 7 | `/admin/generation-requests` | `generation_requests` | Read |
| 8 | `/admin/ai-generation-examples` | `ai_generation_examples` | Create, read, update, delete |
| 9 | `/admin/llm-models` | `llm_models` | Create, read, update, delete; provider dropdown |
| 10 | `/admin/llm-providers` | `llm_providers` | Create, read, update, delete |
| 11 | `/admin/llm-responses` | `llm_responses` | Read, expandable full response text |
| 12 | `/admin/allowed-signup-domains` | `allowed_signup_domains` | Create, read, update, delete |
| 13 | `/admin/whitelisted-emails` | `whitelisted_emails` | Create, read, update, delete |

`/votes` remains available with its existing functionality. The dashboard links to every section. The eleven Week 7 URLs use the shared `app/admin/[section]/page.tsx` route, restricted to the section allowlist; unknown section names return not-found.

## Implementation

- `lib/admin/sections.ts`: exact columns and editable fields from the supplied schema, route allowlist, labels, field types, access modes.
- `lib/admin/auth.ts`: server-side Google session verification with the existing Supabase server helper and a fresh `profiles.is_superadmin` check.
- `lib/admin/validation.ts`: field allowlists, required/nullable inputs, numeric bounds, UUIDs, domains, emails, URL validation, safe database error messages.
- `app/admin/actions.ts`: authenticated server mutations. Reads and writes use the signed-in user's Supabase session and existing RLS, never a service-role key. Create generates UUIDs and timestamps; update supplies `updated_at`. Returning exactly one ID prevents a missing or RLS-filtered row from being reported as a successful mutation.
- `components/admin/RecordsManager.tsx`: accessible field labels, create/edit forms, deletion confirmation, pending/success/error states, full text expansion, and empty states. Failed submissions preserve entered values.
- `components/admin/Week7Navigation.tsx`: dashboard cards and shared section navigation.
- `app/admin/[section]/page.tsx`: access gate, explicit column queries, stable ordering, 25-record pagination, complete provider options, retry links.
- `app/admin/[section]/loading.tsx` and `error.tsx`: loading and recoverable error UI.
- `app/page.tsx`: the only modified pre-existing source file; adds Week 7 dashboard navigation.
- `tests/admin.test.mjs`: dependency-free Node test harness using the existing TypeScript package; real validation/auth/action modules with mocked database/framework boundaries.

The existing generations table holds AI-generated movie taglines (`generated_text`); these remain viewable in `/generations`. No image upload feature or image database columns are introduced.

## Automated checks

```sh
npm run build
npm run lint
node --test tests/admin.test.mjs
git diff --check
```

On Windows PowerShell installations that block `npm.ps1`, use `npm.cmd run build` and `npm.cmd run lint`. Building needs access to Google Fonts for the project's existing Geist fonts.

The tests cover all six CRUD sections, mix updates, denied direct mutations, read-only protections, unknown sections, authentication/role failures, malformed inputs, duplicate/foreign-key/RLS errors, and stale rows. These are simulated database tests, not live Supabase mutation tests.

## Manual acceptance with Google accounts

1. Signed out: visit every new route directly. Verify that no records or forms appear and the login/dashboard link is available.
2. Sign in with a non-superadmin profile. Verify that each route is denied. Sign in with a superadmin profile and verify the dashboard navigation and record lists.
3. In each of the six CRUD sections, create a clearly identified test record, refresh to check persistence, edit it, refresh again, cancel one deletion, then confirm deletion. Check that the record disappears after refresh. For providers/models, create a provider first, select it on the model, and delete the model before the provider.
4. In prompt chain mix, edit an existing record's weight and active status, check persistence, and restore the original values. Confirm chain/model IDs cannot be edited and create/delete controls are absent. Try negative and over-precision weights; verify validation errors.
5. Check the four read-only sections. Expand long prompts/responses and verify that no edit/delete controls are present. Check step ordering and request/model IDs.
6. Try duplicate terms, model keys, provider names, domains, and email addresses. Confirm useful errors and preserved form input. Try deleting a referenced provider/model and confirm the foreign-key message.
7. Check an empty section and a section with more than 25 records. Test next/previous links and a page beyond the last page. Test loading/error UI using browser network controls.
8. Recheck Week 6: Google login/sign-out, `/users`, `/generations` CRUD, and `/votes` display.

Live authenticated CRUD and visual browser acceptance require the user's Google superadmin session; no credentials or session tokens are stored in the tests.

## Delete control regression fix

All six CRUD lists now place Edit/Delete in the first, sticky column so horizontal scrolling cannot hide the controls. Existing-record editors also have a red Delete record button. Delete opens a native modal dialog that identifies the selected record, focuses Cancel, supports Escape, and displays any failure inside the dialog. Only Confirm delete calls the existing superadmin-protected Supabase delete action.

Successful deletion closes the editor and returns to `/admin/<section>?deleted=1` (the first page), with a success notice that survives a pagination remount. For Terms this is `/admin/terms?deleted=1`. Read-only sections and prompt chain mix do not gain delete access.

The 29 automated tests include all six CRUD sections' visible action placement, edit-form delete controls, cancellation, confirmation, selected-record IDs, successful navigation, success notices after remount, and failure handling. Database/framework calls are mocked; live deletion has not been performed on user records.
