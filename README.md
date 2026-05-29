# True Cost Project

Small static launch site for True Cost Project.

## Site Structure

- `index.html` is the homepage.
- `about.html` and `act.html` are the main interior pages.
- `privacy.html` and `terms.html` are placeholder legal pages.
- `copy/` holds editable page text.
- `assets/` holds shared styles, scripts, icons, fonts, and images.

## Preview

```powershell
python -m http.server 8000
```

Open `http://127.0.0.1:8000/`.

## Edit Copy

PowerShell:

```powershell
.\edit.ps1
```

Bash:

```sh
./edit.sh
```

Open `http://127.0.0.1:8787/index.html?dev=1`.

## Fresh Clone And Edit

PowerShell:

```powershell
git clone <repo-url> truecostproject; cd truecostproject; .\edit.ps1
```

Bash:

```sh
git clone <repo-url> truecostproject && cd truecostproject && ./edit.sh
```

## Quick Check

```sh
node tools/check-site.mjs
```
