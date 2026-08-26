#!/usr/bin/env node
/**
 * Construit les référentiels générés à partir de `data/referentiels/`.
 *
 *   npm run donnees:generer
 *   npm run donnees:generer -- --verifier
 *
 * Produit **un fichier par domaine** dans `src/genere/referentiels/`, plus un
 * manifeste. Un simulateur ne charge que les domaines qu'il emploie : voir
 * `docs/ARCHITECTURE_CIBLE.md` §2.4. Un fichier unique obligerait le simulateur
 * de succession à télécharger les barèmes de l'IFI, et demain l'historique des
 * taux de change, dont il n'a aucun usage.
 *
 * Ces fichiers sont chargés par une balise `<script>` classique, donc de façon
 * synchrone, ce qui évite de rendre asynchrones des calculs existants au moment
 * même où l'on en extrait les données.
 *
 * Ils sont versionnés, afin que le dépôt reste testable sans exécuter d'abord
 * une commande. `--verifier` échoue s'ils ne correspondent plus à `data/` :
 * c'est ce contrôle qui empêche une modification manuelle de passer inaperçue.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validerReferentiel, formaterRapport } = require('./lib/schema-referentiel');
const {
  DOSSIER_GENERE,
  FICHIER_MANIFESTE,
  RACINE,
  cheminGenere,
  listerReferentiels,
  lireReferentiel,
  simulateursDuDomaine,
} = require('./lib/referentiels');

const EN_TETE = `/**
 * FICHIER GÉNÉRÉ — NE PAS MODIFIER À LA MAIN.
 *
 * Source de vérité : data/referentiels/%DOMAINE%.json
 * Régénération    : npm run donnees:generer
 *
 * Toute correction se fait dans data/, jamais ici : une modification manuelle
 * serait perdue à la prochaine génération, et « npm run donnees:generer --
 * --verifier » la signale.
 *
 * Chargé par : %SIMULATEURS%
 */`;

/** Construit le contenu du fichier généré d'un domaine. */
function construire(referentiel) {
  const simulateurs = simulateursDuDomaine(referentiel);
  const enTete = EN_TETE
    .replace('%DOMAINE%', referentiel.domaine)
    .replace('%SIMULATEURS%', simulateurs.length ? simulateurs.join(', ') : 'aucun simulateur');

  return `${enTete}

'use strict';

(function (global) {
  var DOMAINE = ${JSON.stringify(referentiel, null, 2)};

  if (typeof module === 'object' && module.exports) {
    module.exports = DOMAINE;
  } else {
    global.REFERENTIELS = global.REFERENTIELS || {};
    global.REFERENTIELS[${JSON.stringify(referentiel.domaine)}] = DOMAINE;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
`;
}

/** Construit le manifeste : ce que contient chaque fichier, et qui le charge. */
function construireManifeste(referentiels) {
  const domaines = {};
  Object.keys(referentiels).sort().forEach((domaine) => {
    const referentiel = referentiels[domaine];
    domaines[domaine] = {
      libelle: referentiel.libelle,
      fichier: cheminGenere(domaine),
      entrees: referentiel.entrees.length,
      simulateurs: simulateursDuDomaine(referentiel),
    };
  });

  return `${JSON.stringify({
    commentaire:
      'FICHIER GÉNÉRÉ — ne pas modifier à la main. Décrit les référentiels générés, '
      + 'leur contenu et les simulateurs qui les emploient. La liste des simulateurs '
      + 'est déduite du champ utilisePar des données : elle ne se tient pas à la main '
      + 'et ne peut donc pas se périmer. Régénération : npm run donnees:generer.',
    domaines,
  }, null, 2)}\n`;
}

/** Lit et valide tous les référentiels. */
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

  return { parDomaine, erreurs };
}

/** Fichiers présents dans le dossier généré, qu'ils soient attendus ou non. */
function fichiersPresents() {
  if (!fs.existsSync(DOSSIER_GENERE)) return [];
  return fs.readdirSync(DOSSIER_GENERE).sort();
}

function principal(arguments_) {
  const verifier = arguments_.includes('--verifier');
  const { parDomaine, erreurs } = collecter();

  if (erreurs) {
    console.error('\nGénération abandonnée : les données ne sont pas conformes au schéma.');
    return 1;
  }

  const attendus = new Map();
  Object.values(parDomaine).forEach((referentiel) => {
    attendus.set(`${referentiel.domaine}.js`, construire(referentiel));
  });
  attendus.set('manifeste.json', construireManifeste(parDomaine));

  // Un fichier généré dont le domaine a disparu de data/ doit être supprimé,
  // sinon un simulateur pourrait continuer de charger des données mortes.
  const orphelins = fichiersPresents().filter((nom) => !attendus.has(nom));

  if (verifier) {
    const problemes = [];
    for (const [nom, contenu] of attendus) {
      const chemin = path.join(DOSSIER_GENERE, nom);
      if (!fs.existsSync(chemin)) problemes.push(`${nom} est absent`);
      else if (fs.readFileSync(chemin, 'utf8') !== contenu) {
        problemes.push(`${nom} ne correspond plus à data/referentiels/`);
      }
    }
    orphelins.forEach((nom) => problemes.push(`${nom} ne correspond à aucun domaine de data/`));

    if (problemes.length) {
      problemes.forEach((p) => console.error(`✗ ${p}`));
      console.error(
        '\n  Soit un fichier généré a été modifié à la main, soit la génération n\'a pas'
        + ' été relancée.\n  Lancer : npm run donnees:generer',
      );
      return 1;
    }
    console.log(`✓ ${attendus.size} fichier(s) généré(s) correspondent à data/referentiels/.`);
    return 0;
  }

  fs.mkdirSync(DOSSIER_GENERE, { recursive: true });
  for (const [nom, contenu] of attendus) {
    fs.writeFileSync(path.join(DOSSIER_GENERE, nom), contenu, 'utf8');
  }
  orphelins.forEach((nom) => {
    fs.rmSync(path.join(DOSSIER_GENERE, nom));
    console.log(`  supprimé : ${nom} — plus aucun domaine ne lui correspond`);
  });

  const dossier = path.relative(RACINE, DOSSIER_GENERE);
  console.log(`✓ ${dossier}/ — ${Object.keys(parDomaine).length} domaine(s), un fichier chacun.`);
  Object.entries(parDomaine).forEach(([domaine, referentiel]) => {
    const simulateurs = simulateursDuDomaine(referentiel);
    console.log(`  ${domaine} → ${simulateurs.join(', ') || 'aucun simulateur'}`);
  });
  return 0;
}

if (require.main === module) {
  process.exitCode = principal(process.argv.slice(2));
}

module.exports = { principal, construire, construireManifeste };
