# Partie 3 — Configuration et lancement du bot Syryana
# Usage : clic droit > Exécuter avec PowerShell  OU  .\scripts\setup-part3.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "`n=== Syryana Bot — Partie 3 ===`n" -ForegroundColor Magenta

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "[OK] Fichier .env cree depuis .env.example" -ForegroundColor Green
} else {
    Write-Host "[--] .env existe deja" -ForegroundColor Yellow
}

Write-Host "`nInstallation des dependances..." -ForegroundColor Cyan
npm install

Write-Host "`nChargement des questions quiz..." -ForegroundColor Cyan
npm run seed-quiz

$envContent = Get-Content .env -Raw
$missing = @()

if ($envContent -match 'DISCORD_TOKEN=votre_token') { $missing += 'DISCORD_TOKEN' }
if ($envContent -match 'CLIENT_ID=votre_client') { $missing += 'CLIENT_ID' }
if ($envContent -match 'GUILD_ID=votre_serveur') { $missing += 'GUILD_ID' }

if ($missing.Count -gt 0) {
    Write-Host "`n[!] Remplis ces champs dans .env avant de continuer :" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host "    - $_" }
    Write-Host "`nOuvre le fichier :" -ForegroundColor Cyan
    Write-Host "    $root\.env`n"
    notepad .env
    Read-Host "Appuie sur Entree quand tu as sauvegarde .env"
}

Write-Host "`nDeploiement des commandes slash..." -ForegroundColor Cyan
npm run deploy-commands

Write-Host "`nDemarrage du bot (Ctrl+C pour arreter)...`n" -ForegroundColor Green
npm start
