#!/bin/bash
set -e

echo "=== Installation Syrbot (Oracle Cloud) ==="

cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"

if [ ! -f .env ]; then
  echo "ERREUR: fichier .env manquant. Cree-le avec: nano .env"
  exit 1
fi

if ! grep -q "DISCORD_TOKEN=" .env || grep -q "DISCORD_TOKEN=votre_token" .env; then
  echo "ERREUR: remplis DISCORD_TOKEN dans .env"
  exit 1
fi

echo "-> npm install..."
npm install

echo "-> Questions quiz..."
npm run seed-quiz

echo "-> Commandes slash Discord..."
npm run deploy-commands

echo "-> Demarrage PM2..."
pm2 delete syrbot 2>/dev/null || true
pm2 start npm --name syrbot -- run start:prod
pm2 save

echo "-> PM2 au demarrage du serveur..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | bash || true
pm2 save

echo ""
echo "=== Termine ==="
pm2 status
echo "Logs: pm2 logs syrbot"
