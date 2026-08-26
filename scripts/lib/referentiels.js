/**
 * Accès aux fichiers de référentiels.
 *
 * Un seul module connaît l'emplacement des données et le nom des fichiers
 * générés, afin qu'un déplacement de dossier ne se retrouve pas recopié dans
 * chaque script.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.resolve(__dirname, '..', '..');
const DOSSIER_REFERENTIELS = path.join(RACINE, 'data', 'referentiels');
const DOSSIER_IMPORTS = path.join(RACINE, 'data', 'imports');

/**
 * Dossier des référentiels générés.
 *
 * Un fichier par domaine, et non un fichier unique : un simulateur ne charge
 * que les domaines qu'il emploie. Voir `docs/ARCHITECTURE_CIBLE.md` §2.4.
 */
const DOSSIER_GENERE = path.join(RACINE, 'src', 'genere', 'referentiels');
const FICHIER_MANIFESTE = path.join(DOSSIER_GENERE, 'manifeste.json');

/** Chemin du fichier généré d'un domaine, relatif à la racine du dépôt. */
function cheminGenere(domaine) {
  return path.posix.join('src', 'genere', 'referentiels', `${domaine}.js`);
}

/** Liste les référentiels, triés, pour que la sortie soit reproductible. */
function listerReferentiels(dossier = DOSSIER_REFERENTIELS) {
  if (!fs.existsSync(dossier)) return [];
  return fs
    .readdirSync(dossier)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => path.join(dossier, f));
}

function lireReferentiel(fichier) {
  return JSON.parse(fs.readFileSync(fichier, 'utf8'));
}

/** Écrit un référentiel avec une mise en forme stable et un saut de ligne final. */
function ecrireReferentiel(fichier, referentiel) {
  fs.mkdirSync(path.dirname(fichier), { recursive: true });
  fs.writeFileSync(fichier, `${JSON.stringify(referentiel, null, 2)}\n`, 'utf8');
}

/**
 * Simulateurs qui emploient une entrée.
 *
 * Une entrée contestée n'a pas de `utilisePar` : ce sont ses variantes qui
 * portent chacune les simulateurs qui l'appliquent.
 */
function simulateursDeLEntree(entree) {
  if (entree.statutValidation === 'conteste') {
    return (entree.variantes || []).flatMap((v) => v.utilisePar || []);
  }
  return entree.utilisePar || [];
}

/**
 * Simulateurs qui emploient au moins une entrée d'un domaine, triés.
 *
 * C'est la donnée elle-même qui dit qui s'en sert : aucune liste n'est tenue
 * à la main, donc aucune ne peut se périmer.
 */
function simulateursDuDomaine(referentiel) {
  const vus = new Set();
  referentiel.entrees.forEach((entree) => {
    simulateursDeLEntree(entree).forEach((cle) => vus.add(cle));
  });
  return [...vus].sort();
}

module.exports = {
  RACINE,
  DOSSIER_REFERENTIELS,
  DOSSIER_IMPORTS,
  DOSSIER_GENERE,
  FICHIER_MANIFESTE,
  cheminGenere,
  listerReferentiels,
  lireReferentiel,
  ecrireReferentiel,
  simulateursDeLEntree,
  simulateursDuDomaine,
};
