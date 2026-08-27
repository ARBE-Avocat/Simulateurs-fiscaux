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
data/                                             # Données fiscales (voir data/README.md)
scripts/                                          # Outillage : import, validation, génération
tests/                                            # Tests automatisés (voir tests/README.md)
docs/                                             # Documentation de projet
```

Chaque simulateur est aujourd'hui indépendant : il peut être ouvert, modifié ou déplacé seul, et son bouton « Accueil » pointe vers `index.html`, situé dans le même dossier.

Cette autonomie **n'est plus une propriété garantie**. L'architecture cible, décrite dans `docs/ARCHITECTURE_CIBLE.md`, prévoit des ressources partagées — données fiscales, feuille de style commune — référencées par chemin relatif. Le mode de consultation supporté sera alors un serveur HTTP, et le dossier devra rester complet.

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

## Données fiscales

Les barèmes, taux, seuils et abattements sont progressivement sortis des
fichiers HTML vers le dossier `data/`, où chaque valeur porte sa source, sa date
d'effet et son statut de validation.

```bash
npm run donnees:valider     # vérifie la cohérence des référentiels
npm run donnees:generer     # reconstruit le fichier lu par les simulateurs
npm run donnees:importer -- <fichier.csv>   # normalise un CSV officiel
```

`data/README.md` décrit la procédure complète de mise à jour d'une valeur
fiscale et le format des CSV acceptés.

## Contrôles complets

Une seule commande enchaîne tous les contrôles du dépôt :

```bash
npm run verifier
```

Elle contrôle la syntaxe de tout le JavaScript — y compris celui embarqué dans
les pages HTML —, valide les référentiels fiscaux, vérifie que les fichiers
générés correspondent toujours aux données, valide la série de taux de change,
puis lance les tests.

Ce sont exactement les contrôles exécutés automatiquement à chaque `push` et sur
chaque pull request : ce qui passe sur votre poste passe sur GitHub. En cas
d'échec en ligne, relancer cette commande en local reproduit le problème sans
attendre.

## Avertissement

Ces outils sont fournis à titre purement informatif et indicatif. Ils ne constituent en aucun cas un conseil juridique ou fiscal personnalisé. Pour toute situation réelle, consultez un professionnel du droit fiscal.
