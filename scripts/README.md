This folder contains helper scripts for safe local cleanup related to secrets and `.env` files.

remove_env_from_git.ps1
- Purpose: backup local `.env`, remove it from Git tracking (so it is not committed further), commit and push the change.
- Usage (from repository root, PowerShell):

```powershell
# dry-run to see actions without changing anything
.\scripts\remove_env_from_git.ps1 -DryRun

# actually perform removal, commit and push
.\scripts\remove_env_from_git.ps1
```

Important notes
- This script DOES NOT rewrite Git history. If the secret was committed in previous commits, you must purge history using `git filter-repo` or the BFG repo-cleaner.
- Rewriting history requires force-push and coordination with collaborators.
- After removing secrets from the repository, revoke and rotate any exposed API keys (Google OAuth, Stripe, etc.).

Quick commands for history purge (manual; run only if you understand consequences):

1) git-filter-repo (recommended)

```powershell
# install: pip install git-filter-repo
# clone bare mirror
git clone --mirror https://github.com/USERNAME/REPO.git
cd REPO.git
# remove the file from history
git filter-repo --invert-paths --paths .env
# push cleaned history
git push --force
```

2) BFG (simpler for removing files)

```powershell
# clone bare mirror
git clone --mirror https://github.com/USERNAME/REPO.git
cd REPO.git
# download bfg jar and then
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

If you want, I can generate an automated script for history purge, but it requires careful review and team coordination.

Full cleanup (interactive)
- `full_cleanup.ps1` — interactive script that:
	- backs up `.env` locally, runs `remove_env_from_git.ps1` to stop tracking `.env`, and optionally runs `purge_history_with_filterrepo.ps1` to remove `.env` from all commits (force-push).
	- prompts for confirmation before any destructive step and performs a dry-run of the history purge first.

Usage:

```powershell
# interactive flow (will ask for confirmation)
.\scripts\full_cleanup.ps1

# optional: pass repo url and extra paths
.\scripts\full_cleanup.ps1 -RepoUrl "https://github.com/USERNAME/REPO.git" -PathsToRemove ".env","secrets.txt"
```

Warning: `full_cleanup.ps1` may run `purge_history_with_filterrepo.ps1` which force-pushes rewritten history. Coordinate with collaborators and rotate keys after cleanup.

Automated helper script
- `purge_history_with_filterrepo.ps1` — clones a mirror of the repo, runs `git-filter-repo` to remove paths (like `.env`) and force-pushes the cleaned history. Use with care and coordinate with collaborators. Example:

```powershell
# dry-run
.\scripts\purge_history_with_filterrepo.ps1 -RepoUrl "https://github.com/USERNAME/REPO.git" -PathsToRemove ".env" -DryRun

# actual run (will force-push cleaned history)
.\scripts\purge_history_with_filterrepo.ps1 -RepoUrl "https://github.com/USERNAME/REPO.git" -PathsToRemove ".env"
```

Notes:
- The script expects `git-filter-repo` installed (pip install git-filter-repo). The script will attempt to install it to the user site if Python is present.
- After a history rewrite, all collaborators must re-clone the repository or follow steps to reset their local clones. Force-push will change commit SHAs.
- Always rotate exposed secrets after removing them from history.