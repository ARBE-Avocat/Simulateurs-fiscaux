# Simulateurs fiscaux — Arthur Beldi

Ensemble de simulateurs fiscaux et patrimoniaux français, à usage informatif. Le
site est statique : des pages HTML, quelques scripts partagés et des données
fiscales, sans framework ni serveur applicatif.

## Accéder aux simulateurs

La page d'accueil `index.html` liste tous les simulateurs. Depuis n'importe quel
simulateur, le bouton **Accueil** (en haut de la page) y ramène.

Chaque simulateur a une adresse stable, sans millésime : elle ne change pas
lors d'une mise à jour annuelle des barèmes. Les anciennes adresses — un fichier
à la racine, nommé avec une date — restent valides et renvoient vers la nouvelle.

## Simulateurs disponibles

| Adresse | Description |
|---|---|
| `simulateurs/irpp/` | Calculateur complet IR / CEHR / CDHR pour un foyer fiscal, avec onglets plus-values, dons & réductions et IFI. Barème 2026 sur les revenus 2025. |
| `simulateurs/ir-cehr-cdhr/` | IR / CEHR / CDHR appliqués à une cession de titres : comparaison flat tax / barème / barème + quotient, et impact d'un apport-cession 150-0 B ter. |
| `simulateurs/plus-value-immobiliere/` | Calcul de la plus-value immobilière et de l'impôt dû lors de la cession d'un bien (art. 150 U et suivants du CGI). |
| `simulateurs/ifi/` | Estimation de l'Impôt sur la Fortune Immobilière (art. 964 et suivants du CGI). |
| `simulateurs/succession/` | Calcul des droits de succession par héritier selon le lien de parenté et les abattements applicables. |
| `simulateurs/demembrement/` | Simulation d'une donation avec démembrement de propriété (usufruit / nue-propriété). |

Le millésime des barèmes employés est affiché dans chaque page.

## Structure du projet

```
index.html                  # Page d'accueil
simulateurs/<slug>/index.html   # Une page par simulateur, à son adresse stable
src/                        # Scripts partagés : conventions, lecture des référentiels,
                            #   millésime, taux de change ; src/genere/ est produit
data/                       # Données fiscales et taux de change (voir data/README.md)
scripts/                    # Outillage : import, validation, génération, build, serveur local
tests/                      # Tests automatisés (voir tests/README.md)
docs/                       # Documentation de projet, jamais publiée
site/                       # Site construit par `npm run build`, ignoré par Git
```

Le dépôt et le site publié ont la même arborescence : ce qui fonctionne servi
depuis la racine du dépôt fonctionne tel quel une fois publié. Les pages
chargent des ressources partagées par chemin relatif ; le dossier doit donc
rester complet, et l'ouverture d'une page par double-clic (`file://`) n'est pas
un mode supporté. `docs/CODEMAP.md` indique où vit chaque chose.

## Utilisation

Le seul prérequis est Node.js 22 ou plus récent. Aucune installation de
dépendance n'est nécessaire.

```bash
npm run dev
```

puis ouvrir `http://localhost:8000/`. Le serveur sert la racine du dépôt ;
`npm run dev -- --port 9000` change le port. Tout autre serveur statique
convient aussi, par exemple `python3 -m http.server 8000`.

Pour produire le site publiable :

```bash
npm run build      # construit site/ ; échoue si un lien relatif est cassé
```

`site/` ne contient que ce qui est livré : l'accueil, les simulateurs, les
scripts partagés, le repli des taux de change et les redirections depuis les
anciennes adresses. Ni la documentation, ni les tests, ni les référentiels
sources n'y figurent. C'est ce dossier que GitHub Pages publie, à chaque fusion
dans `main`, par `.github/workflows/publier.yml`.

## Tests automatisés

Les simulateurs sont couverts par des tests exécutables en une commande, sans
installation ni dépendance :

```bash
npm test
```

Ils utilisent le lanceur intégré à Node.js (version 22 ou plus récente), ne font
aucun appel réseau et n'ouvrent aucun navigateur. Ils vérifient aujourd'hui que
chaque simulateur se charge sans erreur, que les liens de l'accueil restent
valides, et que les moteurs de calcul produisent les montants relevés avant
chaque refactorisation.

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
vérifie que le site se construit sans lien cassé, puis lance les tests.

Ce sont exactement les contrôles exécutés automatiquement à chaque `push` et sur
chaque pull request : ce qui passe sur votre poste passe sur GitHub. En cas
d'échec en ligne, relancer cette commande en local reproduit le problème sans
attendre.

## Contribuer

`CONTRIBUTING.md` décrit le cycle d'une modification, de l'issue à la pull
request, et la procédure de mise à jour d'une valeur fiscale.

## Avertissement

Ces outils sont fournis à titre purement informatif et indicatif. Ils ne constituent en aucun cas un conseil juridique ou fiscal personnalisé. Pour toute situation réelle, consultez un professionnel du droit fiscal.
