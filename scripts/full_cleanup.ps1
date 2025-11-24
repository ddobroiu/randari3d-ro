<#
Full cleanup helper (interactive)

What it does:
- Backups local `.env` to `..\env-backup` with timestamp
- Runs `remove_env_from_git.ps1` to remove `.env` from index, commit and push
- Optionally runs `purge_history_with_filterrepo.ps1` to remove `.env` from all commits (will force-push)

Important: This script WILL prompt before any destructive action. It does NOT rotate any keys — you must rotate secrets manually.
#>

param(
    [string]$RepoUrl = "",
    [string[]]$PathsToRemove = @('.env')
)

function Fail([string]$msg){ Write-Host $msg -ForegroundColor Red; exit 1 }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail "git not found in PATH. Install Git and try again." }

$cwd = Get-Location
Write-Host "Working directory: $cwd"

if (-not (Test-Path ".env")) {
    Write-Host "No .env file found in the repository root. Exiting." -ForegroundColor Yellow
    exit 0
}

# Backup .env
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$backupDir = Join-Path -Path $cwd -ChildPath "..\env-backup"
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
$backupFile = Join-Path -Path $backupDir -ChildPath ".env.bak.$timestamp"
Copy-Item -Path ".env" -Destination $backupFile -Force
Write-Host "Backed up .env -> $backupFile" -ForegroundColor Green

# Run remove_env_from_git.ps1
if (-not (Test-Path ".\scripts\remove_env_from_git.ps1")) { Fail "Missing scripts/remove_env_from_git.ps1" }

Write-Host "Next: remove .env from git index, commit, and push (script will run)." -ForegroundColor Cyan
$ok = Read-Host "Proceed with removing .env from git index now? (y/N)"
if ($ok -ne 'y' -and $ok -ne 'Y') { Write-Host "Aborted by user."; exit 0 }

try {
    & .\scripts\remove_env_from_git.ps1
} catch {
    Fail "remove_env_from_git.ps1 failed: $_" 
}

Write-Host "
IMPORTANT: If the secret was present in earlier commits, it still exists in history and must be purged and keys rotated.
" -ForegroundColor Yellow

$purgeAnswer = Read-Host "Purge history (remove .env from all commits) using git-filter-repo? This rewrites history and force-pushes (y/N)"
if ($purgeAnswer -eq 'y' -or $purgeAnswer -eq 'Y') {
    if ($RepoUrl -eq '') {
        # try to infer remote url
        $remoteUrl = git remote get-url origin 2>$null
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($remoteUrl)) {
            $remoteUrl = Read-Host "Enter repository URL to purge (e.g. https://github.com/USERNAME/REPO.git)"
        }
    } else { $remoteUrl = $RepoUrl }

    Write-Host "Running dry-run of purge script first..." -ForegroundColor Cyan
    & .\scripts\purge_history_with_filterrepo.ps1 -RepoUrl $remoteUrl -PathsToRemove $PathsToRemove -DryRun

    $go = Read-Host "Dry-run complete. Proceed with actual purge and force-push? (y/N)"
    if ($go -ne 'y' -and $go -ne 'Y') { Write-Host "Purge skipped."; exit 0 }

    Write-Host "Running purge (this will force-push cleaned history)." -ForegroundColor Yellow
    & .\scripts\purge_history_with_filterrepo.ps1 -RepoUrl $remoteUrl -PathsToRemove $PathsToRemove
    Write-Host "Purge finished." -ForegroundColor Green
}

Write-Host "
NEXT STEPS (you must do):
- Revoke and rotate any exposed keys (Google OAuth, Stripe, Replicate, etc.).
- Update secrets in GitHub Actions / Vercel / Netlify / CI to the new values.
- Tell collaborators to reclone the repository if history was rewritten.
" -ForegroundColor Yellow

Write-Host "Done. If you want, I can generate a team message for collaborators or step-by-step rotation instructions." -ForegroundColor Cyan
