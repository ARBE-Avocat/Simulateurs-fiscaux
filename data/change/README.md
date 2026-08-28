# Taux de change

Série de taux de change quotidiens, un fichier par année.

| | |
|---|---|
| Période | 1999-01-04 → 2026-06-24 |
| Jours cotés | 7 034 |
| Jours non cotés | 3 000 — week-ends et jours fériés |
| Devises | 30 |
| Volume | 2,8 Mo au total, environ 100 Ko par année |

## Pourquoi ce dossier n'est pas dans `referentiels/`

Un taux de change n'est pas une donnée fiscale. Il ne porte ni date d'effet, ni
statut de validation au sens de `data/schema/README.md` : il vaut ce qu'il valait
ce jour-là, et aucun référent ne le « valide ». Lui imposer le schéma fiscal
reviendrait à forcer le format. Il a donc le sien, et sa propre validation :

```bash
npm run change:valider
```

## Pourquoi un fichier par année

La série entière pèse près de 4 Mo. Elle était embarquée dans le simulateur de
plus-value immobilière, qui la faisait donc télécharger en entier à qui ouvrait
la page — pour deux dates.

Découpée par année, une page ne charge que ce dont elle a besoin. Une simulation
courante en demande deux, soit environ 200 Ko.

`manifeste.json` indique les années disponibles et les bornes de la série. C'est
lui que la page consulte avant de demander un fichier : réclamer 1995 n'a pas de
sens, la série commence en 1999.

## Format

```json
{
  "schema": 1,
  "domaine": "change",
  "annee": 2015,
  "source": { "origine": "…", "reference": "inconnue", "note": "…" },
  "devises": ["AUD", "BRL", "…"],
  "joursNonCotes": ["2015-01-01", "2015-01-03", "…"],
  "cotations": {
    "2015-01-02": { "AUD": 1.4779, "USD": 1.2043, "…": 0 }
  }
}
```

Une date par ligne dans le fichier : le volume reste raisonnable et l'ajout
d'une cotation se lit comme une ligne ajoutée dans un diff.

Un jour sans aucune cotation figure dans `joursNonCotes` et non dans
`cotations`. Une devise absente d'un jour coté n'était pas publiée ce jour-là —
c'est le cas du rouble à partir de 2022.

## Quel taux s'applique à une date

Le simulateur retient **le jour coté le plus proche de la date demandée, en
avant comme en arrière, à égalité d'écart le jour suivant l'emportant sur le
jour précédent**, dans la limite de dix jours d'écart. Au-delà, aucun taux
n'est retenu et la page ne montre pas de résultat plutôt qu'un montant faux.

Pour un samedi, le vendredi reste le plus proche (1 jour, contre 2 pour le
lundi) et continue d'être retenu, sans changement par rapport à l'ancienne
règle. Pour un **dimanche**, en revanche, le lundi est réellement plus proche
(1 jour) que le vendredi (2 jours) : la règle retient désormais le lundi, alors
que l'ancienne règle, qui ne remontait qu'en arrière, retenait le vendredi.
Pour un jour chaumé isolé en semaine — entouré de deux jours cotés, également
proches en avant et en arrière — le jour suivant est retenu à égalité d'écart.

Cette règle a été tranchée par le référent fiscal, fiche 3.5 de
`docs/CORRECTIONS_A_VALIDER.md` et issue #1. Elle remplace l'ancienne règle du
code d'origine (« dernier jour coté à la date demandée ou avant »), qui n'avait
jamais été écrite ailleurs que dans le code et n'était pas confirmée.

## Provenance

La série a été extraite du simulateur de plus-value immobilière, où elle était
embarquée sans qu'aucune source ne soit indiquée. Son premier jour est le
4 janvier 1999, premier jour de cotation de l'euro, et elle porte les devises
habituellement publiées comme taux de référence — ce qui **suggère** une reprise
des taux de référence de la Banque centrale européenne, relayés par la Banque de
France.

Cette origine n'est pas établie. Le champ `source.reference` vaut donc
`"inconnue"`, et le restera jusqu'à confirmation du référent.

L'extraction a été vérifiée exhaustivement : 301 044 comparaisons entre la série
d'origine et les fichiers produits, sur toutes les dates et toutes les devises,
sans un seul écart. Un échantillon de 3 375 taux, relevé avant l'extraction, est
conservé dans `tests/fixtures/change-echantillon.json` et rejoué à chaque
exécution des tests — c'est la seule trace exploitable maintenant que la série
n'est plus dans le fichier HTML.
