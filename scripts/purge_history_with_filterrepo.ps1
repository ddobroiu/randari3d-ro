<#
Usage: run from any folder. The script will clone a mirror, remove paths, and push cleaned history.
Requires: git, python with git-filter-repo installed (pip install git-filter-repo)

Example:
.\scripts\purge_history_with_filterrepo.ps1 -RepoUrl "https://github.com/USERNAME/REPO.git" -PathsToRemove ".env","secrets.txt" -DryRun

WARNING: This rewrites history and will force-push to the remote. Coordinate with collaborators.
#>

param(
    [Parameter(Mandatory=$true)] [string]$RepoUrl,
    [string[]]$PathsToRemove = @('.env'),
    [string]$MirrorDir = "$env:TEMP\repo-mirror",
    [switch]$DryRun,
    [switch]$UseBFG
)

function Fail([string]$msg){ Write-Host $msg -ForegroundColor Red; exit 1 }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail "git not found in PATH. Install Git and try again." }

if ($UseBFG) {
    Write-Host "BFG mode selected. Ensure you have BFG jar available in PATH or specify its path in the script." -ForegroundColor Yellow
}

Write-Host "Mirror dir: $MirrorDir"

if (Test-Path $MirrorDir) {
    Write-Host "Mirror directory already exists. Removing it to start fresh." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $MirrorDir
}

Write-Host "Cloning mirror from $RepoUrl..."
git clone --mirror $RepoUrl $MirrorDir
if ($LASTEXITCODE -ne 0) { Fail "git clone --mirror failed." }

Push-Location $MirrorDir

if ($UseBFG) {
    Write-Host "BFG mode is not fully automated by this script. See scripts/README.md for BFG steps." -ForegroundColor Yellow
    Pop-Location
    exit 0
}

# Ensure git-filter-repo is available
try {
    git filter-repo --help > $null 2>&1
} catch {
    Write-Host "git-filter-repo not found. Attempting to check Python/pip..." -ForegroundColor Yellow
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) { Fail "git-filter-repo not found and Python is not available to install it. Install 'git-filter-repo' first (pip install git-filter-repo)." }
    Write-Host "Trying to install git-filter-repo via pip..." -ForegroundColor Cyan
    python -m pip install --user git-filter-repo
    if ($LASTEXITCODE -ne 0) { Fail "Failed to install git-filter-repo. Install it manually and re-run the script." }
}

Write-Host "Paths to remove from history: $($PathsToRemove -join ', ')" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "Dry run: would run git filter-repo to remove these paths in $MirrorDir" -ForegroundColor Cyan
    Pop-Location
    exit 0
}

# Build arguments for git-filter-repo
$pathsArg = $PathsToRemove | ForEach-Object { "--paths '$_'" } | Out-String

Write-Host "Running git-filter-repo to remove specified paths..." -ForegroundColor Cyan
git filter-repo --invert-paths --paths $(($PathsToRemove -join ' '))
if ($LASTEXITCODE -ne 0) { Fail "git-filter-repo failed." }

Write-Host "Expiring reflog and garbage collecting..." -ForegroundColor Cyan
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host "Pushing cleaned history to origin (force)..." -ForegroundColor Yellow
git push --force --all
git push --force --tags

Pop-Location

Write-Host "Purge complete. Remind collaborators to reclone or reset their local clones." -ForegroundColor Green
