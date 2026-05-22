# Permissions Discord — Syryana (important)

## Pourquoi les nouveaux voient tout sans être vérifiés ?

Souvent ce n’est **pas** le bot : c’est **@everyone** qui a le droit de **voir** tous les salons.

Le rôle « Non vérifié » ne suffit pas si @everyone peut déjà tout voir.

## Configuration correcte

### 1. Hiérarchie des rôles (en haut = plus fort)

```
Syrbot (bot)
Staff / Syryana
Membre
Non vérifié
@everyone
```

Le **bot doit être au-dessus** de « Non vérifié » et « Membre ».

### 2. Permissions du bot

Coche **Gérer les rôles** (inclus dans Administrateur si tu lui as donné Admin).

### 3. Salon #vérification

| Rôle | Voir le salon | Envoyer messages |
|------|---------------|------------------|
| @everyone | ❌ Refuser | ❌ |
| Non vérifié | ✅ Autoriser | ✅ |
| Membre | ❌ Refuser | ❌ |

### 4. Tous les autres salons (#général, #quiz, …)

| Rôle | Voir le salon |
|------|---------------|
| @everyone | ❌ **Refuser** |
| Non vérifié | ❌ Refuser |
| Membre | ✅ Autoriser |

### 5. Commandes utiles

- `/diagnostic` — liste ce qui ne va pas
- `/sync-verification` — remet « Non vérifié » à qui n’a pas encore validé

## Quiz automatique

- **Pas besoin** que le bot soit administrateur.
- Il faut : `QUIZ_CHANNEL_ID` dans `.env`, permission **Envoyer messages** dans ce salon, et **le bot allumé** à 20h (PC ou hébergement 24h).
- Test manuel : `/quiz` dans #quiz-du-jour.
