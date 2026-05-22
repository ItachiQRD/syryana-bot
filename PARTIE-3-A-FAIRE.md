# Partie 3 — Ce qui est fait / ce qu'il te reste

## Déjà fait automatiquement

- [x] `npm install` — dépendances installées
- [x] Fichier `.env` créé (copie de `.env.example`)
- [x] `npm run seed-quiz` — 30 questions quiz en base

## À faire par toi (5 minutes)

Ouvre le fichier **`syryana-bot\.env`** et remplace les valeurs :

| Variable | Où la trouver |
|----------|----------------|
| `DISCORD_TOKEN` | [discord.com/developers](https://discord.com/developers/applications) → ton app → **Bot** → Reset Token |
| `CLIENT_ID` | Même page → **General Information** → Application ID |
| `GUILD_ID` | Clic droit sur ton serveur Discord → Copier l'identifiant du serveur |
| `VERIFICATION_CHANNEL_ID` | Clic droit sur `#vérification` → Copier l'identifiant du salon |
| `UNVERIFIED_ROLE_ID` | Paramètres serveur → Rôles → Non vérifié → Copier l'ID |
| `MEMBER_ROLE_ID` | Idem pour le rôle Membre |
| `WELCOME_CHANNEL_ID` | `#bienvenue` |
| `QUIZ_CHANNEL_ID` | `#quiz-du-jour` |
| `LEADERBOARD_CHANNEL_ID` | `#classement` |
| `SUGGESTIONS_CHANNEL_ID` | `#suggestions` |

**Mode développeur** : Discord → Paramètres → Avancés → Mode développeur **Activé**.

## Lancer le bot

Dans PowerShell :

```powershell
cd c:\Users\Amina\Downloads\zbib\syryana-bot
npm run setup
npm run deploy-commands
npm start
```

Ou tout-en-un (ouvre le Bloc-notes pour `.env` si besoin) :

```powershell
.\scripts\setup-part3.ps1
```

## Dernière étape sur Discord

Dans `#vérification`, tape :

```
/panel-verification
```

---

Quand `.env` est rempli, envoie-moi un message et je lance `deploy-commands` + `start` pour toi si tu veux.
