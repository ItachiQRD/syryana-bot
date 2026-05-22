# Bot Discord Syryana

Bot officiel pour le serveur **Syryana** : gamification, quiz culture générale quotidien, classement, pièces et boutique.

## Fonctionnalités

- **XP & niveaux** — messages, vocal, récompense quotidienne, série (streak)
- **Quiz du jour** — automatique à l’heure configurée, boutons interactifs, podium XP
- **Classement** — `/classement` + récap hebdomadaire automatique
- **Boutique** — pièces gagnées via l’XP, achats (boost, indices, etc.)
- **Mini-défi** — `/defi` nombre mystère 1–20
- **Bienvenue** — message embed brandé Syryana
- **VIP** — multiplicateur XP + **lecteur musique** (`/musique`) en salon vocal (YouTube & liens directs)
- **Vérification entrée** — questionnaire obligatoire (réponses exactes) avant accès au serveur
- **Roue quotidienne** — `/roue` une fois par jour
- **Duels** — `/duel @membre` quiz rapide 1v1
- **Sondages** — `/sondage` avec votes boutons
- **Suggestions** — `/suggestion` vers un salon dédié
- **Transfert pièces** — `/transfert` entre membres
- **Level-up** — annonce automatique en montant de niveau

## Installation rapide

### 1. Créer le bot Discord

1. Va sur [Discord Developer Portal](https://discord.com/developers/applications)
2. **New Application** → nomme-la « Syryana Bot »
3. Onglet **Bot** → **Reset Token** → copie le token
4. Active **MESSAGE CONTENT INTENT** et **SERVER MEMBERS INTENT**
5. Onglet **OAuth2 → URL Generator** :
   - Scopes : `bot`, `applications.commands`
   - Permissions : Send Messages, Embed Links, Use Slash Commands, Read Message History, **Connect**, **Speak** (musique VIP)
6. Invite le bot sur ton serveur avec l’URL générée

### 2. Configurer le projet

```bash
cd syryana-bot
npm install
copy .env.example .env
```

Édite `.env` :

- `DISCORD_TOKEN` — token du bot
- `CLIENT_ID` — ID application (General Information)
- `GUILD_ID` — clic droit sur ton serveur → Copier l’identifiant
- `QUIZ_CHANNEL_ID` — ID du salon `#quiz-du-jour`
- `WELCOME_CHANNEL_ID` — salon bienvenue
- `LEADERBOARD_CHANNEL_ID` — salon classement

### 3. Lancer

```bash
npm run seed-quiz
npm run deploy-commands
npm start
```

## Commandes slash

| Commande | Description |
|----------|-------------|
| `/syryana` | Guide du serveur et des points |
| `/profil` | Ton XP, niveau, pièces, série |
| `/quotidien` | Récompense journalière + streak |
| `/classement` | Top 10 XP |
| `/boutique` | Liste des objets |
| `/acheter` | Acheter un objet |
| `/defi` | Mini-jeu nombre 1–20 |
| `/quiz` | Lancer le quiz (admin) |
| `/verifier` | Questionnaire d'entrée |
| `/panel-verification` | Publier le panneau (admin) |
| `/verification-reload` | Recharger les questions (admin) |
| `/roue` | Roue de la fortune (1x/jour) |
| `/duel` | Duel quiz 1v1 |
| `/sondage` | Créer un sondage |
| `/suggestion` | Envoyer une suggestion |
| `/transfert` | Offrir des pièces |
| `/stats` | Stats serveur |
| `/musique jouer` | **VIP** — YouTube ou URL audio (en vocal) |
| `/musique passer` | **VIP** — piste suivante |
| `/musique arreter` | **VIP** — stop + vider la file |
| `/musique file` | **VIP** — file d'attente |
| `/musique en-cours` | **VIP** — piste actuelle |

## Musique VIP (salons vocaux)

1. Crée un rôle **VIP** sur Discord et copie son ID dans `VIP_ROLE_ID`
2. Le membre VIP doit être **dans un salon vocal**
3. Exemples :
   - `/musique jouer requete:https://www.youtube.com/watch?v=...`
   - `/musique jouer requete:Syryana playlist` (recherche YouTube)
   - `/musique jouer requete:https://exemple.com/musique.mp3` (lien direct)

> Sur **Render**, utilise **Node 22** (`NODE_VERSION=22.16.0`). FFmpeg est inclus via `ffmpeg-static`.

## Vérification à l'entrée

Voir **`VERIFICATION.md`** pour le format des questions.

1. Crée les rôles **Non vérifié** et **Membre**
2. Le salon `#vérification` visible seulement par Non vérifié
3. Remplis `data/verification-questions.json` (tu m'enverras le contenu plus tard)
4. `/panel-verification` dans ce salon
5. Les nouveaux membres passent `/verifier` — **mauvaise réponse = bloqué**

## Hébergement 24/7

| Guide | Usage |
|-------|--------|
| **`DEPLOY-GRATUIT.md`** | **Render + UptimeRobot (gratuit, recommandé)** |
| **`DEPLOY-24-7.md`** | Railway (payant après essai) |
| **`DEPLOY-ORACLE.md`** | Oracle Cloud (option avancée, non requis) |

## Personnalisation Syryana

- `src/config.js` — couleurs, titres de niveaux, récompenses XP
- `src/scripts/seed-quiz.js` — ajoute tes questions (contenu Syryana, musique, etc.)
- `GUIDE-SERVEUR-SYRYANA.md` — structure des salons et rôles

## Prochaines étapes possibles

- Rôles automatiques par niveau
- Quiz thématiques « Soirée Syryana »
- Intégration Twitch/YouTube (annonces live)
- Classement mensuel avec reset et récompenses

---

*Fait pour la communauté Syryana — reste actif, grimpe au classement !*
