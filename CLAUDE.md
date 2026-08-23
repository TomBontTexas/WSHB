# Deploying this app to GitHub Pages

This folder is a self-contained static web app (HTML/CSS/JS, no build step, no
backend — `serve.py` is only a local dev server). The owner wants it hosted on
GitHub Pages so anyone with the link can open, save, and load files with full
browser capability (no sandbox restrictions) — this is a deliberate alternative
to publishing it as a Claude Artifact, which blocks plain file downloads and
requires routing saves through a capability API with a limited extension
allowlist. Follow this playbook end to end when asked to "put this on GitHub
Pages" / "deploy this" / "do what we did for WSVB."

This was last done for the sibling project WSVB (`Warp Space\WSVB\web`),
deployed to `https://tombonttexas.github.io/wsvb/`. Same steps here.

## 0. Confirm scope with the user first

- Confirm the **repo name** (default: lowercase folder/app name, e.g. `wshb`).
- Tell them explicitly: **the repo will be public** — GitHub Pages on a free
  account only serves from public repos, so the source and all app data
  becomes world-readable. Don't proceed without at least a clear statement of
  this; this is exactly the kind of visible-to-others, hard-to-fully-reverse
  action that needs a heads-up first.

## 1. Check prerequisites

```powershell
git --version
gh --version
gh auth status
```

If either binary is missing, install via winget (each is a system-level
change — tell the user before running):

```powershell
winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements --silent
winget install --id GitHub.cli -e --source winget --accept-package-agreements --accept-source-agreements --silent
```

Winget-installed tools may not be on PATH in the *current* shell session yet.
Refresh it before using them:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

If `gh auth status` isn't logged in, start the device flow **in the
background** (it blocks waiting for browser approval) and relay the printed
code/URL to the user — do not fabricate completion, wait for it to actually
finish:

```powershell
gh auth login --hostname github.com --git-protocol https --web
```

Once logged in, wire git to use gh's stored credentials (otherwise `git push`
fails with "terminal prompts disabled"):

```powershell
gh auth setup-git
```

## 2. Set a git identity (only if `git config --global user.name` is empty)

Since the repo will be public, use GitHub's private no-reply email, not the
user's real one:

```powershell
gh api user --jq '.id,.login'
# -> use the two printed values below
git config --global user.name "<login>"
git config --global user.email "<id>+<login>@users.noreply.github.com"
git config --global init.defaultBranch main
```

## 3. Prep this folder

- Add/confirm a `.gitignore` here excluding at least `*.log` (there's a
  `server.log`/`server_err.log` from `serve.py` that must not be committed).
- Identify the app's real entry file (check what's actually in this folder —
  it won't be `index.html`; follow whatever `<script src="...">` / `<link
  href="...">` order the entry HTML file itself declares, don't assume it
  matches WSVB's file list).
- **Do not rewrite or "clean up" the app's code as part of this** — deploying
  is a packaging task, not a refactor.

## 4. Init, commit

```powershell
git -C "<this-folder>" init
git -C "<this-folder>" add -A
git -C "<this-folder>" status   # sanity-check what's staged before committing
git -C "<this-folder>" commit -m "Initial commit: <app name> web app"
```

## 5. Create the GitHub repo and push

```powershell
gh repo create <repo-name> --public --source="<this-folder>" --remote=origin --push --description "<short description>"
```

## 6. Enable GitHub Pages (serve from `main` branch root)

```powershell
gh api -X POST repos/<owner>/<repo-name>/pages -f "source[branch]=main" -f "source[path]=/"
```

## 7. Add an `index.html` redirect if the entry file isn't literally `index.html`

The bare Pages URL (`https://<owner>.github.io/<repo-name>/`) 404s otherwise.
Use a plain meta-refresh, pointing at the real entry file:

```html
<!DOCTYPE html>
<meta charset="utf-8">
<title><App Title></title>
<meta http-equiv="refresh" content="0; url=<EntryFile>.html">
<link rel="canonical" href="<EntryFile>.html">
<p>Redirecting to <a href="<EntryFile>.html"><EntryFile>.html</a>…</p>
```

Commit and push it (`git add index.html && git commit -m "..." && git push`).

## 8. Verify

```powershell
gh api repos/<owner>/<repo-name>/pages/builds/latest --jq '.status'
# wait for "built", then:
Invoke-WebRequest -Uri "https://<owner>.github.io/<repo-name>/<EntryFile>.html" -UseBasicParsing -TimeoutSec 15
```

Report the final URL back to the user:
`https://<owner>.github.io/<repo-name>/`

## 9. Future updates

Just edit files in this folder normally, then:

```powershell
git -C "<this-folder>" add -A
git -C "<this-folder>" commit -m "..."
git -C "<this-folder>" push
```

Pages rebuilds automatically, usually in under a minute.
