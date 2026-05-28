# Quiz comique `/sassou`

## Utilisation

| Commande | Effet |
|----------|--------|
| `/sassou` | Envoie une **question aléatoire** dans le salon |
| `/sassou numero:2` | Envoie la question **n°2** |
| `/sassou-reload` | Recharge le fichier JSON (admin) |

Quand quelqu’un clique **A / B / C / D**, la **chute** (blague) s’affiche en **message privé**.

## Modifier les blagues

Fichier : **`config/sassou-questions.json`**

```json
{
  "id": "mon-id-unique",
  "question": "Ta question ici ?",
  "choices": [
    {
      "label": "Réponse courte (bouton)",
      "response": "La chute / blague affichée en MP"
    }
  ]
}
```

- **4 choix max** (A, B, C, D)
- **`id`** : unique, sans espaces (ex. `papa-sport`)
- Après modification : `/sassou-reload` ou redéploiement Render

## Déploiement

```bash
npm run deploy-commands
```

Puis sur Render : **Deploy latest commit**.
