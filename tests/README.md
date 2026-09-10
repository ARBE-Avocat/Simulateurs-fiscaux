# Tests

Depuis la racine du dépôt :

```
node --test tests/
```

Node 18 ou plus récent ; aucune dépendance à installer. Les tests
évaluent le script du simulateur IFI dans un contexte `vm` avec un DOM
minimal simulé (le réseau y est désactivé).
