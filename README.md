# True Cost Project

Static launch site for True Cost Project.

## Preview

```powershell
python -m http.server 8000
```

Open `http://127.0.0.1:8000/`.

## Copy Editor

The editor is local-only. It appears only when the site is served by the edit server and opened with `?dev=1`.

PowerShell:

```powershell
.\edit.ps1
```

Bash:

```sh
./edit.sh
```

Open `http://127.0.0.1:8787/index.html?dev=1` and edit body copy in place. Button and navigation labels stay clickable, and same-site links preserve `?dev=1` so you can move between pages while editing. When an edited field loses focus, the editor writes the matching `./copy/**/*.txt` file and rebuilds the HTML. The bottom Save button runs the static acceptance checks, commits only the already-synced copy and pages, and pushes to `origin main` when the tree is clean. If other local changes are pending, the copy commit stays local and the push waits until the working tree is clean.

The edit server binds to `127.0.0.1`, only enables the editor behind `?dev=1`, and does not return local filesystem paths in browser API errors.

## Clean Path Policy

Public site files should use relative paths for local pages, assets, scripts, styles, fonts, and copy files. Canonical URLs, social-card URLs, JSON-LD IDs, `robots.txt`, and `sitemap.xml` should use the public organization domain. Do not hardcode local machine paths, user names, home folders, drive paths, or account-specific deployment paths into public files or copy files.

Fresh clone and launch:

```powershell
git clone <repo-url> truecostproject; cd truecostproject; .\edit.ps1
```

```sh
git clone <repo-url> truecostproject && cd truecostproject && ./edit.sh
```

## Copy Build

Copy lives under `./copy`. Each file maps to an element with a matching `data-copy-id`.

```sh
node tools/apply-copy.mjs
```

GitHub Pages can run the same script before publishing.

## Acceptance Check

```sh
node tools/check-site.mjs
```

This verifies the static pages, copy-file coverage, important assets, safe placeholder links, and public metadata domain. The edit server runs it before pushing. The Pages workflow runs it before deploying.
