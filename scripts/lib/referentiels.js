/**
 * Accès aux fichiers de référentiels.
 *
 * Un seul module connaît l'emplacement des données, afin qu'un déplacement de
 * dossier ne se retrouve pas recopié dans chaque script.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.resolve(__dirname, '..', '..');
const DOSSIER_REFERENTIELS = path.join(RACINE, 'data', 'referentiels');
const DOSSIER_IMPORTS = path.join(RACINE, 'data', 'imports');
const FICHIER_GENERE = path.join(RACINE, 'src', 'genere', 'referentiels.js');

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

module.exports = {
  RACINE,
  DOSSIER_REFERENTIELS,
  DOSSIER_IMPORTS,
  FICHIER_GENERE,
  listerReferentiels,
  lireReferentiel,
  ecrireReferentiel,
};
