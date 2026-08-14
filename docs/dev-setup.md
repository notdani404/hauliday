# Dev setup — per-repo identity overrides

This machine's **global** shell is on the work account: `gh` is logged in with
`danieldchan` active, and global git config uses the work email. A fresh clone of this
repo **inherits that** — commits get authored as work, and Vercel Hobby blocks any
git-push deploy whose commit author email isn't on the personal Vercel account.

The overrides below are **local git config**, which is *not* version-controlled. A fresh
clone silently reverts to the work identity and re-blocks deploys. **Re-run both blocks
after any clone.**

## What Vercel actually enforces

- Vercel Hobby checks the **author email of the deployed commit** — not the pusher.
  Pushing successfully as `notdani404` is not enough; the commit author must be personal.
- `vercel deploy` via the **CLI bypasses** the author check. Only **git-push deploys**
  enforce it.

## 1. Commit author identity (what Vercel checks)

```sh
git config --local user.name  "notdani404"
git config --local user.email "34337052+notdani404@users.noreply.github.com"
```

## 2. Push/fetch credential (authenticate as personal without switching gh)

Mints the personal token on demand, so plain `git push` authenticates as `notdani404`
while the global **active** `gh` account stays `danieldchan`. Depends only on
`notdani404` staying logged in to `gh` — it need not be active; `gh auth token --user`
reads it either way. No `gh auth switch` needed.

```sh
# Empty string first RESETS the inherited global gh helper for this repo…
git config --local credential.https://github.com.helper ""
# …then add ours.
git config --local --add credential.https://github.com.helper \
  '!f() { echo username=notdani404; echo "password=$(gh auth token --user notdani404)"; }; f'
```

Verify (global active gh stays work; git ops here act as personal):

```sh
gh auth status --active | grep account   # danieldchan
gh auth token --user notdani404 >/dev/null && echo ok   # resolves anyway
git fetch origin && echo "authenticated as notdani404"
```

## 3. Supabase (Phase 0+)

Use a **personal** Supabase org (clean IP/continuity, same reasoning as the GitHub repo
and personal Vercel scope). The CLI's keychain login tends to throw `401 Unauthorized`
on `db push`; the reliable path is a **dashboard-generated PAT** passed inline:

```sh
SUPABASE_ACCESS_TOKEN=sbp_… pnpm db:push
```

## Accounts — keep everything on the personal identity

- GitHub repo: private, under `notdani404`
- Vercel: personal account/scope
- Supabase: personal org
