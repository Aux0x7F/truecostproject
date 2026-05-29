# True Cost Site Operator Skill

Use this skill for all work in this repository.

## Purpose

This repo is a small static launch site with a local copy editor. The normal user is not assumed to be a developer, a terminal user, or a Git user. Treat the default job as using agent actions to update content, assets, links, simple pages, previews, and publishing without exposing code or command-line complexity.

## Default User Posture

Assume the user has no code knowledge and no terminal knowledge unless they clearly establish developer posture.

Developer posture is established when the user says something like:

- dev mode
- developer
- code
- refactor
- architecture
- implementation
- API
- script
- workflow
- CI
- debug this code

Once developer posture is established in the chat, it may carry for that chat. Otherwise, keep language and actions centered on site outcomes and have the agent do the technical steps.

For default no-code posture:

- Do not start by giving shell commands.
- Do not ask the user to open a terminal, run scripts, inspect files, stage commits, or push.
- Do not lead with local URLs, file paths, branch names, command names, or implementation details.
- Offer clear choices the user can answer in words.
- Perform the actual local command, browser, file, check, commit, and push work as the agent when requested.
- If the user asks "How do we edit the site?", answer by describing what they can ask the agent to change and offer to open the editor for them.
- Give commands only when the user asks for them, asks for dev mode, or clearly wants to operate the shell themselves.

## Setup And Authentication Guardrails

Handle setup as agent work first. Do not turn a missing runtime or GitHub login into a command list for a no-code user.

When setup blocks editing, preview, or publishing:

1. Check whether the needed tool already exists.
2. Prefer the existing installed tool when it works.
3. If Node is missing, prefer a minimal portable Node runtime inside `.local/` and put it on the agent process path for this repo/session.
4. Keep any local runtime, dependency folder, cache, env file, token, or auth artifact ignored and out of commits.
5. Use the repo's existing scripts after setup instead of adding new package dependencies.
6. If GitHub authentication is missing, use an official GitHub browser or device sign-in flow and describe the user step in plain language.
7. Never ask the user to paste secrets, tokens, passwords, or cookies into chat.

Good no-code phrasing:

```text
Publishing needs a GitHub sign-in. I can start the sign-in flow, then you will approve it in your browser. After that I will retry the publish.
```

Bad default phrasing:

```text
Run gh auth login, then install Node and rerun the script.
```

## Normal Work Categories

Classify the request into the smallest useful category before acting.

### Copy

Primary path:

1. Prefer `copy/**/*.txt` for text updates.
2. Run `node tools/apply-copy.mjs`.
3. Run `node tools/check-site.mjs`.
4. Preview when layout or wording length could affect the page.
5. Commit and push when requested, or when the local editor Save flow is the action being tested.

Do not ask a low-code user to edit HTML for copy changes.

### Editor

Agent path:

1. Offer to open the editor or ask what page/section needs changes.
2. Launch the editor for the user when requested.
3. Explain only the user-facing behavior: click text to edit, click away to sync, Escape cancels the active field, Save publishes.
4. Do not show launch commands unless the user asks how to run it themselves.

Developer/manual path:

```powershell
.\edit.ps1
```

Open:

```text
http://127.0.0.1:8787/index.html?dev=1
```

Editor guardrails:

- Edit body copy only.
- Do not expose button labels, navigation labels, or Instagram demo tile text as editable fields.
- Same-site links and buttons remain followable and preserve `?dev=1`.
- Focus loss syncs the field to `copy/` and regenerates HTML.
- Escape cancels unsynced changes in the active field.
- Save runs checks, commits already-synced copy/page files, and pushes when the tree is clean.

### Visual Assets

For hero, banner, and placeholder art work:

1. Use static assets or CSS placeholders that preserve the current aspect ratios.
2. Do not add a new framework or image pipeline unless explicitly requested.
3. Keep text out of hero and banner elements unless it is baked into final art and represented through appropriate alt/context.
4. Verify mobile and desktop framing when the change affects layout.

### Social Links And Feed

For social work:

1. Update visible links and metadata in static files.
2. Use the existing Curator-ready handoff for Instagram feed takeover.
3. Do not add scraping, proxies, undocumented APIs, or fragile social fetches unless the user explicitly accepts that dependency.
4. Keep demo social tiles as mockup scaffolding, not copy-editor content.

### Simple Pages And Navigation

When adding a page:

1. Copy the structure from an existing page with the closest role.
2. Add matching `copy/<page>/*.txt` files for editable copy.
3. Add navigation only when the user asks or the page must be public.
4. Carry over the shared CSS, JS, wordmark, footer, floating Donate behavior, SEO metadata shape, and editor behavior.
5. Update `sitemap.xml` when the page should be indexed.
6. Run `node tools/apply-copy.mjs` and `node tools/check-site.mjs`.

### Links And Launch Inputs

When final external URLs arrive:

1. Replace the relevant dead links.
2. Remove `data-pending-link` from links that are now real.
3. Keep unresolved forms or donation destinations dead-linked.
4. Run checks and preview the affected path.

## Guardrails

- Do not default to complex dev work.
- Do not introduce frameworks, package managers, servers, databases, auth, analytics, or build steps unless explicitly requested.
- Do not require the end user to have `rg`, Node knowledge, Git knowledge, or code-editor knowledge.
- Agents may use developer tools internally, but user-facing instructions should stay simple.
- If tooling is missing, prefer local portable setup under `.local/` over global installation.
- Preserve user edits already in the worktree. If a copy file or page is dirty, treat it as user/client input unless proven otherwise.
- Use relative paths for local assets and pages.
- Do not write local machine paths, home folders, user names, or account-specific deployment paths into public site files or copy files.
- Keep first paint static and scrapeable.
- Keep broken links safe.
- Keep placeholders honest. Do not invent legal status, real endorsements, donation processors, or partner claims.
- Prefer small, direct changes over broad rewrites.

## Acceptance Checks

Before calling work done:

```sh
node tools/apply-copy.mjs
node tools/check-site.mjs
```

Also verify in a browser when:

- Layout or visual assets changed.
- Navigation changed.
- Editor behavior changed.
- Footer, floating Donate, hero, mobile menu, or page structure changed.

For simple copy-only changes, command checks plus a targeted page preview are usually enough.

## Communication Style For Low-Code Users

Say what changed in site terms:

- "I updated the About copy and pushed it."
- "I opened the editor. Click the text you want to change, then click away when done."
- "That link is still a placeholder because the final form URL is not in the repo yet."
- "The check passed, so the site is ready to publish."

Avoid leading with implementation details unless the user asked for dev mode or code-level reasoning.

If a fresh no-code user asks, "How do we edit the site?", a good answer is:

```text
Tell me what you want changed, or I can open the editor for you.

In the editor, you can click normal page text, type the new wording, and click away to save that field. Buttons and navigation still work like links. If you change your mind while typing, press Escape to undo that field. When the page looks right, I can publish it.
```
