# Déployer Syrbot sur Oracle Cloud (gratuit 24/7)

Guide pour héberger le bot **Syryana** sur un VPS **Always Free** Oracle — sans limite de temps.

---

## Vue d'ensemble

| Étape | Durée |
|-------|--------|
| Créer compte + VM | 20–40 min |
| Installer le bot | 15 min |
| **Total** | ~1 h la première fois |

Tu auras besoin de : ton fichier **`.env`** local (token Discord, IDs des salons/rôles).

---

## Partie 1 — Compte Oracle Cloud

1. Va sur https://www.oracle.com/cloud/free/
2. **Start for free** → crée un compte (carte parfois demandée pour vérification, **pas de débit** si tu restes Always Free)
3. Choisis une région proche (ex. **France Central** ou **Germany**)

---

## Partie 2 — Créer la machine (VM)

### A. Image Ubuntu

1. Menu **☰** → **Compute** → **Instances**
2. **Create instance**
3. Nom : `syrbot-server`
4. **Image** : **Ubuntu 24.04** (ou 22.04) — Canonical Ubuntu
5. **Shape** : clique **Change shape**
   - **Ampere** (ARM) → `VM.Standard.A1.Flex` — **1 OCPU**, **6 Go RAM** (suffisant)
   - Ou **AMD** → `VM.Standard.E2.1.Micro` (Always Free-eligible)
6. **Networking** : coche **Assign a public IPv4 address**
7. **SSH keys** :
   - **Generate a key pair** → télécharge la clé **privée** (`.key`) → **garde-la secrète**
   - Ou upload ta clé publique si tu sais faire
8. **Boot volume** : 50 Go (défaut OK)
9. **Create**

Attends le statut **Running** (vert). Note l’**IP publique** (ex. `123.45.67.89`).

### B. Ouvrir le pare-feu cloud (SSH)

1. Sur la page de l’instance → lien du **Subnet**
2. **Security Lists** → Default → **Add Ingress Rules**
3. Si pas déjà présent :
   - Source : `0.0.0.0/0`
   - Protocol : **TCP**
   - Port : **22**
   - Description : SSH
4. **Add Ingress Rules**

*(Le bot Discord n’a pas besoin d’ouvrir d’autre port — il se connecte vers Discord en sortie.)*

### C. Pare-feu Ubuntu (sur la VM)

Tu le feras en SSH à l’étape 4.

---

## Partie 3 — Mettre le code sur GitHub (si pas déjà fait)

Sur ton **PC Windows** :

```powershell
cd c:\Users\Amina\Downloads\zbib\syryana-bot
git init
git add .
git commit -m "Bot Syryana pour Oracle Cloud"
```

Sur https://github.com → **New repository** → `syryana-bot` (privé recommandé).

```powershell
git remote add origin https://github.com/TON_PSEUDO/syryana-bot.git
git branch -M main
git push -u origin main
```

**Ne pousse jamais le fichier `.env`** (il est dans `.gitignore`).

---

## Partie 4 — Se connecter en SSH

### Windows (PowerShell)

```powershell
ssh -i "C:\chemin\vers\ta-cle.key" ubuntu@TON_IP_PUBLIQUE
```

Première connexion : tape `yes` si demandé.

Tu dois voir : `ubuntu@syrbot-server:~$`

---

## Partie 5 — Installation automatique

Sur le serveur (copie-colle bloc par bloc) :

```bash
# Mise à jour + outils
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential python3

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # doit afficher v22.x

# PM2 (relance le bot si crash / reboot)
sudo npm install -g pm2

# Clone le bot (remplace par TON repo)
cd ~
git clone https://github.com/TON_PSEUDO/syryana-bot.git
cd syryana-bot

# Fichier .env — on le crée à la main
nano .env
```

Dans **nano** : colle **tout** le contenu de ton `.env` Windows (DISCORD_TOKEN, CLIENT_ID, GUILD_ID, etc.).

- Sauvegarder : **Ctrl+O** → Entrée → **Ctrl+X**

Puis :

```bash
chmod +x scripts/install-oracle.sh
./scripts/install-oracle.sh
```

Le script installe les dépendances, la base quiz, déploie les commandes slash et lance le bot avec **PM2**.

---

## Partie 6 — Vérifier

```bash
pm2 status
pm2 logs syrbot --lines 30
```

Tu dois voir : `✅ Syrbot#... — Bot Syryana en ligne`

Sur Discord : Syrbot **en ligne**, `/verifier` fonctionne.

---

## Partie 7 — Arrêter le bot sur ton PC

**Important** : une fois Oracle OK, **ferme** le terminal `npm start` sur ton ordinateur. Sinon 2 bots = doublons.

---

## Commandes utiles (sur le serveur)

| Commande | Action |
|----------|--------|
| `pm2 status` | État du bot |
| `pm2 logs syrbot` | Logs en direct |
| `pm2 restart syrbot` | Redémarrer |
| `pm2 stop syrbot` | Arrêter |
| `cd ~/syryana-bot && git pull && npm install && pm2 restart syrbot` | Mise à jour code |

---

## Mettre à jour le bot plus tard

```bash
cd ~/syryana-bot
git pull
npm install
node src/deploy-commands.js
pm2 restart syrbot
```

Pour changer les questions : édite `config/verification-questions.json` sur le PC → `git push` → `git pull` sur le serveur → `/verification-reload` sur Discord (admin) ou redémarre PM2.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| SSH refusé | Vérifie IP, clé `.key`, règle port 22 dans Security List |
| `npm install` erreur sqlite | `sudo apt install -y build-essential python3` |
| Bot hors ligne | `pm2 logs syrbot` — token invalide ? |
| Rôle Non vérifié pas donné | Bot doit avoir **Gérer les rôles** + rôle au-dessus sur Discord |
| Quiz 20h ne part pas | `TZ=Europe/Paris` dans `.env`, `QUIZ_CHANNEL_ID` correct |

---

## Coût

**0 €/mois** tant que tu restes dans les ressources **Always Free** (1 VM A1 Flex 1 OCPU / 6 Go RAM = largement suffisant).

---

*Serveur Syryana — Longue vie à Sa Majesté 👑*
