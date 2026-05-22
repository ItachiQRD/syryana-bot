# Guide structure serveur Discord — Syryana

Ce guide complète le bot : il décrit comment organiser le serveur pour **mettre Syryana en valeur** et maximiser l’engagement.

## Catégories recommandées

| Catégorie | Salons | Rôle |
|-----------|--------|------|
| **✨ SYRYANA** | `#annonces`, `#bio-syryana`, `#médias` | Vitrine officielle |
| **🔐 ENTRÉE** | `#vérification` | Questionnaire obligatoire (bot) |
| **💬 COMMUNAUTÉ** | `#général`, `#introductions`, `#fan-art` | Discussion (membres vérifiés) |
| **🎮 COMPÉTITION** | `#quiz-du-jour`, `#classement`, `#défis` | Bot + activité |
| **🔊 VOCAL** | `Salon Syryana`, `Gaming`, `Écoute` | XP vocal |
| **📋 INFO** | `#règles`, `#rôles`, `#aide-bot` | Onboarding |

## Rôles par niveau (à lier au bot plus tard)

Crée des rôles cosmétiques alignés sur les niveaux du bot :

- Novice Syryana → Explorateur → Champion → Légende → Immortel Syryana

Tu peux les attribuer manuellement chaque semaine selon `/classement`, ou automatiser plus tard avec des réactions.

## Routine quotidienne (automatisée par le bot)

| Heure (Paris) | Action |
|---------------|--------|
| **10h** | Rappel : `/quotidien` + quiz ce soir |
| **20h** (configurable) | **Quiz du jour** avec boutons A/B/C/D |
| **Dimanche 12h** | Récap top 5 dans `#classement` |

## Récompenses suggérées (modération)

- **Top 1 hebdo** : rôle « Champion de la semaine » + shoutout dans `#annonces`
- **Série 7 jours** `/quotidien` : 100 pièces bonus (manuel ou futur patch)
- **10 victoires quiz** : badge rôle « Cerveau Syryana »

## Mise en valeur de Syryana

- Épingler un message de bienvenue avec lien vers contenus (chaîne, réseaux, musique).
- Bannière et icône aux couleurs violet/rose (cohérent avec le bot `0x9b59b6`).
- Salon `#bio-syryana` : présentation, univers, projets — seul Syryana (ou staff) poste ; les autres réagissent.
- Événements mensuels : « Soirée Syryana » en vocal + quiz spécial (`/quiz` manuel).

## Rôles vérification

| Rôle | Accès |
|------|--------|
| **Non vérifié** | Uniquement `#vérification` |
| **Membre** | Tout le serveur (après questionnaire) |

Configurer les IDs dans `.env` : `UNVERIFIED_ROLE_ID`, `MEMBER_ROLE_ID`, `VERIFICATION_CHANNEL_ID`.

## Permissions bot

Le bot a besoin de :

- Lire/envoyer messages, embeds, boutons
- Gérer les commandes slash
- Voir les membres (bienvenue)
- États vocaux (XP)

Intents à activer sur le [portail développeur Discord](https://discord.com/developers/applications) :

- `SERVER MEMBERS INTENT`
- `MESSAGE CONTENT INTENT`
