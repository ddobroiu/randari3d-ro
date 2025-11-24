param(
    [string]$EnvFile = ".env",
    [string]$Remote = "origin",
    [string]$Branch = "main",
    [switch]$DryRun
)

function Fail([string]$msg){ Write-Host $msg -ForegroundColor Red; exit 1 }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail "git not found in PATH. Install Git and try again." }

$repoRoot = Get-Location

Write-Host "Repository root: $repoRoot"

if (-not (Test-Path $EnvFile)) {
    Write-Host "No '$EnvFile' found in repository root. Nothing to do." -ForegroundColor Yellow
    exit 0
}

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$backup = "$EnvFile.bak.$timestamp"
Copy-Item -Path $EnvFile -Destination $backup -Force
Write-Host "Backed up '$EnvFile' to '$backup'."

if ($DryRun) {
    Write-Host "Dry run enabled — would run: git rm --cached $EnvFile; git commit -m 'Remove $EnvFile from repository tracking'; git push $Remote $Branch" -ForegroundColor Cyan
    exit 0
}

Write-Host "Removing '$EnvFile' from git index (it will remain locally)."
git rm --cached $EnvFile

Write-Host "Adding '.gitignore' (if present) and committing change."
git add .gitignore 2>$null
try {
    git commit -m "Remove $EnvFile from repository tracking"
} catch {
    Write-Host "Nothing to commit or commit failed. Check git status." -ForegroundColor Yellow
}

Write-Host "Pushing changes to '$Remote/$Branch'"
git push $Remote $Branch

Write-Host "Done. Next steps: purge history (BFG/git-filter-repo) if the secret existed in earlier commits and rotate any exposed keys." -ForegroundColor Green
