# Déployer Syrbot 24h/24 — Guide Syryana

Le bot doit tourner **en ligne en permanence** pour le quiz du soir, la vérification et l’XP.  
**Recommandation : Railway** (simple, ~5 $/mois après essai gratuit).

---

## Avant de déployer

1. Crée un compte **GitHub** : https://github.com
2. Installe **Git** sur ton PC (si pas déjà fait)
3. Prépare ton fichier `.env` local (tu vas recopier les valeurs sur Railway)

**Ne mets jamais le token Discord sur GitHub** — uniquement dans les variables du site d’hébergement.

---

## Étape 1 — Mettre le code sur GitHub

Dans PowerShell :

```powershell
cd c:\Users\Amina\Downloads\zbib\syryana-bot
git init
git add .
git commit -m "Bot Syryana pret pour deploiement"
```

Sur GitHub : **New repository** → nom `syryana-bot` → créer (sans README).

```powershell
git remote add origin https://github.com/TON_PSEUDO/syryana-bot.git
git branch -M main
git push -u origin main
```

---

## Étape 2 — Railway (recommandé)

### Créer le projet

1. Va sur https://railway.app et connecte-toi avec **GitHub**
2. **New Project** → **Deploy from GitHub repo** → choisis `syryana-bot`
3. Railway détecte le `Dockerfile` automatiquement

### Volume (base de données conservée)

1. Dans ton service → **Settings** → **Volumes**
2. **Add Volume** → chemin de montage : `/app/data`
3. Cela garde la base SQLite (XP, quiz, membres vérifiés) après redémarrage

### Variables d’environnement

Onglet **Variables** → ajoute **toutes** ces lignes (copie depuis ton `.env`) :

| Variable | Exemple |
|----------|---------|
| `DISCORD_TOKEN` | ton token |
| `CLIENT_ID` | id application |
| `GUILD_ID` | id serveur |
| `VERIFICATION_CHANNEL_ID` | id salon |
| `UNVERIFIED_ROLE_ID` | id rôle |
| `MEMBER_ROLE_ID` | id rôle |
| `WELCOME_CHANNEL_ID` | id salon |
| `QUIZ_CHANNEL_ID` | id salon |
| `LEADERBOARD_CHANNEL_ID` | id salon |
| `SUGGESTIONS_CHANNEL_ID` | id salon |
| `TZ` | `Europe/Paris` |
| `QUIZ_HOUR` | `20` |
| `QUIZ_MINUTE` | `0` |

### Déployer

- Railway lance le build Docker puis `npm run start:prod`
- Logs : onglet **Deployments** → **View logs**
- Tu dois voir : `✅ Syrbot#... — Bot Syryana en ligne`

### Arrêter le bot sur ton PC

Une fois Railway en ligne, **ferme** le terminal `npm start` sur ton ordinateur — sinon **deux bots** peuvent entrer en conflit (double messages).

---

## Étape 3 — Render (alternative gratuite limitée)

1. https://render.com → compte GitHub
2. **New** → **Blueprint** → connecte le repo
3. Utilise le fichier `render.yaml` du projet
4. Ajoute les **variables d’environnement** (même liste que Railway)
5. Type de service : **Background Worker** (pas Web Service)

Le plan gratuit peut parfois **mettre en veille** le worker — Railway est plus fiable pour un bot Discord.

---

## Vérifier que ça marche

- Syrbot apparaît **en ligne** sur Discord
- `/verifier` fonctionne
- À **20h** (Paris), un quiz part dans `#quiz-du-jour` (vérifie les logs Railway)

---

## Modifier le bot plus tard

1. Modifie le code sur ton PC
2. `git add .` → `git commit -m "description"` → `git push`
3. Railway **redéploie automatiquement**

Pour changer les questions de vérification : édite `config/verification-questions.json` puis push.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Bot hors ligne | Vérifie `DISCORD_TOKEN` dans Variables |
| Double messages | Arrête `npm start` sur ton PC |
| XP perdu après redeploy | Volume `/app/data` mal configuré |
| Commandes / manquantes | Regarde les logs : `deploy-commands` au démarrage |
| Quiz ne part pas | `QUIZ_CHANNEL_ID` + fuseau `TZ` |

---

## Coût indicatif

- **Railway** : crédit gratuit au début, puis environ **5 €/mois**
- **Render worker** : gratuit avec limitations

Pour un serveur communautaire actif, Railway vaut l’investissement.
