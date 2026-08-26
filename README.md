# Simulateurs fiscaux — Arthur Beldi

Ensemble de simulateurs fiscaux et patrimoniaux au format HTML statique, autonomes et utilisables sans installation ni serveur. Chaque simulateur est un fichier `.html` unique (HTML/CSS/JS embarqués) que l'on peut ouvrir directement dans un navigateur.

## Accéder aux simulateurs

Ouvrez **`index.html`** : c'est la page d'accueil, qui liste tous les simulateurs disponibles avec un accès direct à chacun. Depuis n'importe quel simulateur, le bouton **Accueil** (en haut de la page) permet de revenir à cette page d'accueil.

## Simulateurs disponibles

| Fichier | Description |
|---|---|
| `Simulation IRPP - Avril 2026.html` | Calculateur complet IR / CEHR / CDHR pour un foyer fiscal, avec onglets plus-values, dons & réductions et IFI. Barème 2026 sur les revenus 2025. |
| `Simulateur_IR 2025 et CEHR_CDHR 2026.html` | IR / CEHR / CDHR appliqués à une cession de titres : comparaison flat tax / barème / barème + quotient, et impact d'un apport-cession 150-0 B ter. |
| `Simulateur_PV_Immobilière Juillet 2026.html` | Calcul de la plus-value immobilière et de l'impôt dû lors de la cession d'un bien (art. 150 U et suivants du CGI). |
| `Simulation IFI - Avril 2026.html` | Estimation de l'Impôt sur la Fortune Immobilière (art. 964 et suivants du CGI). |
| `Simulation Succession.html` | Calcul des droits de succession par héritier selon le lien de parenté et les abattements applicables. |
| `Simulation démembrement immo - Juin 2026.html` | Simulation d'une donation avec démembrement de propriété (usufruit / nue-propriété). |

## Structure du projet

```
index.html                                        # Page d'accueil
Simulation IRPP - Avril 2026.html
Simulateur_IR 2025 et CEHR_CDHR 2026.html
Simulateur_PV_Immobilière Juillet 2026.html
Simulation IFI - Avril 2026.html
Simulation Succession.html
Simulation démembrement immo - Juin 2026.html
tests/                                            # Tests automatisés (voir tests/README.md)
docs/                                             # Documentation de projet
```

Chaque simulateur est indépendant (pas de dépendance partagée entre les fichiers) : il peut être modifié, renommé ou distribué séparément. Seul le bouton « Accueil » de chaque page pointe vers `index.html`, situé dans le même dossier.

## Utilisation

Aucune installation n'est nécessaire :

1. Ouvrez `index.html` dans un navigateur (double-clic, ou via un serveur statique).
2. Cliquez sur un simulateur pour l'ouvrir.
3. Revenez à l'accueil à tout moment via le bouton **Accueil**.

Pour un développement local avec rechargement propre des liens relatifs, servez le dossier avec un serveur HTTP simple, par exemple :

```bash
python3 -m http.server 8000
```

puis ouvrez `http://localhost:8000/index.html`.

## Tests automatisés

Les simulateurs sont couverts par des tests exécutables en une commande, sans
installation ni dépendance :

```bash
npm test
```

Ils utilisent le lanceur intégré à Node.js (version 22 ou plus récente), ne font
aucun appel réseau et n'ouvrent aucun navigateur. Ils vérifient aujourd'hui que
chaque simulateur se charge sans erreur, que les liens de l'accueil restent
valides, et que le moteur de l'impôt sur le revenu produit les montants attendus.

`tests/README.md` explique comment lancer, lire et écrire un test, ainsi que la
règle appliquée aux valeurs fiscales attendues.

## Avertissement

Ces outils sont fournis à titre purement informatif et indicatif. Ils ne constituent en aucun cas un conseil juridique ou fiscal personnalisé. Pour toute situation réelle, consultez un professionnel du droit fiscal.
