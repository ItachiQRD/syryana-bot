# Questionnaire d'entrée — Syryana

Les questions sont dans **`config/verification-questions.json`**. Après modification, lance `/verification-reload` (ou redéploie sur Railway).

**Ordre actuel :** Charte + allégeance → plus belle femme (Syryana) → plus intelligente (Syryana) → meilleure (Ta mère).

## Format des questions

### Réponse texte (réponse exacte obligatoire)

```json
{
  "id": "nom_syryana",
  "question": "Comment s'appelle la créatrice du serveur ?",
  "type": "text",
  "answers": ["Syryana", "syryana"],
  "caseInsensitive": true,
  "hint": "Prénom ou pseudo officiel"
}
```

- **`answers`** : liste des réponses acceptées (toutes doivent être exactes après normalisation).
- **`caseInsensitive`** : `true` = majuscules ignorées.

### QCM (boutons)

```json
{
  "id": "reglement",
  "question": "As-tu lu le règlement ?",
  "type": "choice",
  "choices": ["Oui, je respecte les règles", "Non"],
  "correctIndex": 0
}
```

- **`correctIndex`** : index de la bonne réponse (0 = première).

## Configuration Discord (obligatoire)

1. Créer un rôle **Non vérifié** — accès **uniquement** au salon `#vérification`.
2. Créer un rôle **Membre** — accès à tout le reste du serveur.
3. Dans `.env` :
   - `UNVERIFIED_ROLE_ID`
   - `MEMBER_ROLE_ID`
   - `VERIFICATION_CHANNEL_ID`
4. Poster le panneau : `/panel-verification` dans `#vérification`.

## Comportement

- À l'arrivée : rôle **Non vérifié** automatique.
- Toutes les questions doivent être **bonnes** pour continuer.
- **3 essais** max par question, sinon recommencer.
- Après validation : rôle **Membre**, bonus XP, message dans `#bienvenue`.

## Commandes

| Commande | Qui |
|----------|-----|
| `/verifier` | Membre — lance ou relance le questionnaire |
| `/panel-verification` | Admin — affiche le bouton « Commencer » |
| `/verification-reload` | Admin — recharge le JSON après modification |
