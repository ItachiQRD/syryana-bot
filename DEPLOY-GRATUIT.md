# Héberger Syrbot GRATUITEMENT (24/7)

## En résumé

| Option | Vraiment 24/7 ? | Difficulté | Carte bancaire |
|--------|-----------------|------------|----------------|
| **Oracle Cloud (VPS gratuit)** | ✅ Oui | ⭐⭐⭐ Difficile | Non |
| **Render + UptimeRobot** | ✅ Souvent oui | ⭐⭐ Moyen | Non |
| **Ton PC allumé** | ✅ Oui | ⭐ Facile | Non |
| **Railway** | ⚠️ Crédits puis payant | ⭐ Facile | Oui |
| **Fly.io** | ⚠️ Limite mensuelle | ⭐⭐ Moyen | Oui |

---

## Option 1 — Render GRATUIT (recommandé si tu veux simple)

Le bot inclut un **petit serveur web** (`health-server.js`) pour que Render ne le mette pas en veille.

### Étapes

1. Code sur **GitHub** (voir `DEPLOY-24-7.md` étape 1)
2. https://render.com → **New** → **Web Service** (pas Static Site)
3. Connecte le repo `syryana-bot`
4. **Runtime** : **Node** (pas Docker si tu configures à la main)
5. **Node version** : **22** (obligatoire — Node 26 casse `better-sqlite3`)
   - Dans Render → **Environment** → `NODE_VERSION` = `22.16.0`
   - Ou laisse le fichier `.nvmrc` du repo (contient `22`)
6. **Environment** : ajoute toutes les variables du `.env`
7. Ajoute aussi : `PORT` = `3000`
8. **Build command** : `npm install`
9. **Start command** : `npm run start:prod`
10. Plan : **Free**

### Garder le bot réveillé (gratuit)

1. Copie l’URL Render du bot (ex. `https://syryana-bot.onrender.com`)
2. Va sur https://uptimerobot.com (gratuit)
3. **Add monitor** → type **HTTP(s)** → URL de ton bot → toutes les **5 minutes**

Sans ça, Render peut **endormir** le service et le bot se déconnecte.

### Disque persistant (XP, quiz, vérification)

Render → ton service → **Disks** → Add disk :
- Mount path : `/app/data`
- Size : 1 GB

Variable d’environnement : `DATA_DIR` = `/app/data`

### Le bot est « éteint » sur Discord ?

| Cause | Solution |
|-------|----------|
| **Render en veille** (plan gratuit) | UptimeRobot sur l’URL du bot (toutes les 5 min) |
| **Bot aussi lancé sur ton PC** | Arrête `npm start` local — un seul bot à la fois |
| **Deploy échoué** | Render → **Logs** → cherche `❌` ou `npm error` |
| **Token invalide** | Regénère le token sur le portail Discord, mets à jour `DISCORD_TOKEN` sur Render |
| **Redémarrage** | Render → **Manual Deploy** → Deploy latest commit |

Variables obligatoires sur Render : `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, `NODE_VERSION=22.16.0`, `PORT=3000`, `DATA_DIR=/app/data` (si disque).

---

## Option 2 — Oracle Cloud (100 % gratuit, plus technique)

- **Always Free** : petit serveur Linux 24/7 sans limite de temps
- Tu installes Node.js, clones le repo, `npm install`, `npm run start:prod`
- Utilise **pm2** pour relancer le bot si il crash :

```bash
npm install -g pm2
pm2 start npm --name syrbot -- run start:prod
pm2 save
pm2 startup
```

Tutoriels YouTube : « Oracle Cloud free tier Ubuntu setup ».

---

## Option 3 — Laisser ton PC allumé (gratuit)

- `npm run start:prod` dans le dossier du bot
- Le PC doit rester **allumé** et connecté à Internet
- Pas idéal pour le quiz à 20h si le PC est éteint

---

## Ce qui n’est PAS gratuit en pratique

- **Railway** : essai puis ~5 €/mois
- **Heroku** : plus de plan gratuit
- **Replit gratuit** : s’endort → bot hors ligne

---

## Conseil Syryana

Pour un serveur communautaire actif : commence par **Render + UptimeRobot** (gratuit, pas de carte si tu restes sur le plan free).  
Si tu veux du **vrai gratuit sans limite**, investis 1–2 h dans **Oracle Cloud**.
