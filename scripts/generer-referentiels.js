#!/usr/bin/env node
/**
 * Construit `src/genere/referentiels.js` à partir de `data/referentiels/`.
 *
 *   npm run donnees:generer
 *   npm run donnees:generer -- --verifier
 *
 * Le fichier produit est le seul point par lequel les simulateurs et les tests
 * lisent les données. Il est chargé par une balise `<script>` classique, donc de
 * façon synchrone : voir `docs/ARCHITECTURE_CIBLE.md` §2.4, qui explique
 * pourquoi ce choix évite de rendre asynchrones des calculs existants au moment
 * même où l'on en extrait les données.
 *
 * Il est versionné, afin que le dépôt reste testable sans exécuter d'abord une
 * commande. `--verifier` échoue s'il ne correspond plus à `data/` : c'est ce
 * contrôle qui empêche une modification manuelle du fichier généré de passer
 * inaperçue.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validerReferentiel, formaterRapport } = require('./lib/schema-referentiel');
const {
  FICHIER_GENERE,
  RACINE,
  listerReferentiels,
  lireReferentiel,
} = require('./lib/referentiels');

const EN_TETE = `/**
 * FICHIER GÉNÉRÉ — NE PAS MODIFIER À LA MAIN.
 *
 * Source de vérité : data/referentiels/
 * Régénération    : npm run donnees:generer
 *
 * Toute correction se fait dans data/, jamais ici : une modification manuelle
 * serait perdue à la prochaine génération, et « npm run donnees:generer --
 * --verifier » la signale.
 */`;

/** Construit le contenu du fichier généré. */
function construire(referentiels) {
  const corps = JSON.stringify(referentiels, null, 2);
  return `${EN_TETE}

'use strict';

(function (global) {
  var REFERENTIELS = ${corps};

  if (typeof module === 'object' && module.exports) {
    module.exports = REFERENTIELS;
  } else {
    global.REFERENTIELS = REFERENTIELS;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
`;
}

function collecter() {
  const fichiers = listerReferentiels();
  const parDomaine = {};
  let erreurs = 0;

  for (const fichier of fichiers) {
    const referentiel = lireReferentiel(fichier);
    const rapport = validerReferentiel(referentiel);
    if (rapport.erreurs.length) {
      console.error(`✗ ${path.relative(RACINE, fichier)}`);
      console.error(formaterRapport(rapport, ''));
      erreurs += rapport.erreurs.length;
      continue;
    }
    if (parDomaine[referentiel.domaine]) {
      console.error(`✗ deux fichiers déclarent le domaine « ${referentiel.domaine} »`);
      erreurs += 1;
      continue;
    }
    parDomaine[referentiel.domaine] = referentiel;
  }

  return { parDomaine, erreurs, nombre: fichiers.length };
}

function principal(arguments_) {
  const verifier = arguments_.includes('--verifier');
  const { parDomaine, erreurs, nombre } = collecter();

  if (erreurs) {
    console.error('\nGénération abandonnée : les données ne sont pas conformes au schéma.');
    return 1;
  }

  const contenu = construire(parDomaine);
  const nom = path.relative(RACINE, FICHIER_GENERE);

  if (verifier) {
    if (!fs.existsSync(FICHIER_GENERE)) {
      console.error(`✗ ${nom} est absent. Lancer : npm run donnees:generer`);
      return 1;
    }
    if (fs.readFileSync(FICHIER_GENERE, 'utf8') !== contenu) {
      console.error(
        `✗ ${nom} ne correspond plus à data/referentiels/.\n`
          + '  Soit le fichier généré a été modifié à la main, soit la génération n\'a pas été relancée.\n'
          + '  Lancer : npm run donnees:generer',
      );
      return 1;
    }
    console.log(`✓ ${nom} correspond à data/referentiels/.`);
    return 0;
  }

  fs.mkdirSync(path.dirname(FICHIER_GENERE), { recursive: true });
  fs.writeFileSync(FICHIER_GENERE, contenu, 'utf8');
  console.log(`✓ ${nom} — ${nombre} référentiel(s), ${Object.keys(parDomaine).length} domaine(s).`);
  return 0;
}

if (require.main === module) {
  process.exitCode = principal(process.argv.slice(2));
}

module.exports = { principal, construire };
