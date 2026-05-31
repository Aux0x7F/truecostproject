---
name: truecost-site-operator
description: Operate the True Cost Project static site from the repository root. Use for no-code onboarding, dependency/auth checks, launching the local editor, updating copy/assets/links/simple pages, previewing, checking, committing, and publishing the truecostproject site.
---

# True Cost Site Operator

Use this skill for all work in this repository.

## First Run Order

After reading `CONTRACT.md`, do this before normal site work:

1. Confirm the agent platform has a connected GitHub account.
2. If not connected, initiate the platform GitHub connector or auth flow and ask the user to approve it.
3. Confirm that account can push to this repo. Prefer connector permission checks or a non-mutating push/access check.
4. If push access is missing, stop. Open the relevant GitHub access screen when possible, or tell the user the repo owner needs to grant write access. Ask them to reprompt after access is granted.
5. Confirm Node is available. Use `node` on PATH when present; otherwise use or install a minimal portable Node runtime under `.local/`.
6. Launch the editor and open `http://127.0.0.1:8787/index.html?dev=1` in the side browser.
7. Then give the no-code intro.

Do not provide running commentary while these checks are happening. Speak only when the user must sign in, request access, make a choice, or when the editor is ready.

## Default User Posture

Assume the user has no code knowledge and no terminal knowledge unless they clearly establish developer posture.

Developer posture is established when the user says something like dev mode, developer, code, refactor, architecture, implementation, API, script, workflow, CI, or debug this code. Once established, it may carry for that chat.

For default no-code posture:

- Do not start by giving shell commands.
- Do not ask the user to open a terminal, run scripts, inspect files, stage commits, or push.
- Do not lead with local URLs, file paths, branch names, command names, or implementation details.
- Offer clear choices the user can answer in words.
- Perform local command, browser, file, check, commit, and push work as the agent.
- Give commands only when the user asks for them, asks for dev mode, or clearly wants shell control.

## No-Code Intro

After the editor is open, use language like this:

```text
The editor is open.

You can ask me to rewrite a section, replace a banner or hero image, update links, add a simple page, preview changes, or publish the site.

You can also click normal page text to edit it directly. Click away to save that field. Press Escape to cancel the field you are typing in.
```

## Setup Guardrails

- Treat setup as agent work first.
- Prefer the agent platform GitHub connector over local CLI auth. If connector tools are not present, request the connector/auth flow when the platform supports it.
- Use local Git or `gh` only as a fallback or proof surface; do not treat it as a replacement for platform account linking when connector linking is available.
- If GitHub auth is missing, use an official browser or device sign-in flow.
- Never ask the user to paste secrets, tokens, passwords, cookies, or auth files into chat.
- If push access is missing, do not proceed to editing or publishing.
- Prefer existing tools before installing anything.
- If Node is missing, prefer portable Node under `.local/`; keep it out of Git. The edit scripts know to look for `.local/node/node.exe`, `.local/node/bin/node`, and `.local/node/node`.
- Keep local runtimes, dependencies, caches, env files, tokens, and auth artifacts out of commits.
- Do not introduce package managers, project dependencies, analytics, databases, or services unless explicitly requested.

## Normal Work

### Copy

1. Prefer `copy/**/*.txt` for text updates.
2. Run `node tools/apply-copy.mjs`.
3. Run `node tools/check-site.mjs`.
4. Preview when wording length could affect layout.
5. Commit and push when requested, or when testing the editor Save flow.

Do not ask a no-code user to edit HTML for copy changes.

### Editor

Agent path:

1. Launch the editor by running the repo edit script or `node tools/edit-server.mjs`.
2. Open the side browser to the local editor with `?dev=1`.
3. Explain only the user-facing behavior.

Editor behavior:

- Edit body copy only.
- Do not expose button labels, navigation labels, or Instagram demo tile text as editable fields.
- Same-site links and buttons remain followable and preserve `?dev=1`.
- Focus loss syncs the field to `copy/` and regenerates HTML.
- Escape cancels unsynced changes in the active field.
- Save runs checks, commits already-synced files, and pushes when the tree is clean.

### Visual Assets

1. Preserve the current hero and banner aspect ratios.
2. Keep hero and banner title/subtitle text as centered editable HTML over the image or gradient.
3. Do not bake essential public-facing title or subtitle copy into the art asset.
4. When changing a hero or banner image, generate or update the section `aria-label` so it describes the visual content without duplicating nearby title copy.
5. Keep the homepage hero capped to the visible viewport below the sticky header, with background cover cropping when needed.
6. Use static assets or CSS placeholders.
7. Verify mobile and desktop framing after layout-affecting changes.

### Social Links And Feed

1. Update visible links and metadata in static files.
2. Use the Curator-ready handoff for Instagram feed takeover.
3. Do not add scraping, proxies, undocumented APIs, or fragile social fetches unless explicitly accepted.
4. Keep demo social tiles as mockup scaffolding, not copy-editor content.

### Simple Pages And Navigation

1. Copy the closest existing page structure.
2. Add matching `copy/<page>/*.txt` files for editable body copy.
3. Include a visual hero or page banner with centered editable `hero-title` and `hero-subtitle` copy files, even if the starting text is blank.
4. Add navigation only when the page should be public.
5. Carry over shared CSS, JS, raster wordmark assets with brand link `aria-label`, footer, floating Donate behavior, SEO metadata, and editor behavior.
6. Update `sitemap.xml` when the page should be indexed.
7. Run copy application and site checks.

### Links And Launch Inputs

1. Replace relevant dead links when final URLs arrive.
2. Remove `data-pending-link` from links that are now real.
3. Keep unresolved forms or donation destinations dead-linked.
4. Run checks and preview affected pages.

## Acceptance Checks

Before calling site work done:

```sh
node tools/apply-copy.mjs
node tools/check-site.mjs
```

Also verify in a browser when layout, navigation, editor behavior, footer, floating Donate, hero, mobile menu, or page structure changed.
