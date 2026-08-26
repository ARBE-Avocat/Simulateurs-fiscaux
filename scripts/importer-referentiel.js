#!/usr/bin/env node
/**
 * Importe un CSV officiel vers un référentiel conforme au schéma (issue #18).
 *
 *   npm run donnees:importer -- data/imports/dmtg-2025.csv --domaine dmtg \
 *     --libelle "Mutations à titre gratuit"
 *
 * Options :
 *   --domaine <id>      identifiant du domaine ; par défaut, déduit du nom du CSV
 *   --libelle <texte>   libellé du domaine ; par défaut, identique au domaine
 *   --sortie <chemin>   fichier produit ; par défaut data/referentiels/<domaine>.json
 *   --verifier          n'écrit rien, se contente de dire si le fichier existant
 *                       correspondrait à ce que produirait l'import
 *
 * Deux garanties :
 *
 * 1. l'import est **déterministe** : entrées triées par identifiant puis
 *    millésime, tranches triées par borne basse, mise en forme fixe. Réimporter
 *    le même CSV ne produit aucun diff ;
 * 2. une donnée invalide **fait échouer la commande sans rien écrire**. Le
 *    référentiel publié n'est jamais laissé dans un état intermédiaire.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { importer, ErreurImport } = require('./lib/importer');
const { validerReferentiel, formaterRapport } = require('./lib/schema-referentiel');
const {
  DOSSIER_REFERENTIELS,
  ecrireReferentiel,
  RACINE,
} = require('./lib/referentiels');

function lireOptions(arguments_) {
  const options = { verifier: false };
  const positionnels = [];
  for (let i = 0; i < arguments_.length; i += 1) {
    const a = arguments_[i];
    if (a === '--verifier') options.verifier = true;
    else if (a.startsWith('--')) {
      const cle = a.slice(2);
      i += 1;
      if (i >= arguments_.length) throw new Error(`option --${cle} sans valeur`);
      options[cle] = arguments_[i];
    } else positionnels.push(a);
  }
  options.csv = positionnels[0];
  return options;
}

function principal(arguments_) {
  let options;
  try {
    options = lireOptions(arguments_);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    return 2;
  }

  if (!options.csv) {
    console.error('Usage : node scripts/importer-referentiel.js <fichier.csv> [--domaine <id>] [--libelle <texte>] [--sortie <chemin>] [--verifier]');
    return 2;
  }

  const chemin = path.resolve(options.csv);
  if (!fs.existsSync(chemin)) {
    console.error(`✗ fichier introuvable : ${options.csv}`);
    return 2;
  }

  const domaine = options.domaine || path.basename(chemin, path.extname(chemin));
  const sortie = options.sortie
    ? path.resolve(options.sortie)
    : path.join(DOSSIER_REFERENTIELS, `${domaine}.json`);

  // Sans `--libelle`, on reprend celui du référentiel existant plutôt que le nom
  // du domaine : le retaper à l'identique à chaque réimport serait une source
  // d'échecs de `--verifier` sans aucun rapport avec les données.
  let libelle = options.libelle;
  if (!libelle && fs.existsSync(sortie)) {
    try {
      libelle = JSON.parse(fs.readFileSync(sortie, 'utf8')).libelle;
    } catch (e) {
      libelle = undefined;
    }
  }

  let referentiel;
  try {
    referentiel = importer(fs.readFileSync(chemin, 'utf8'), {
      domaine,
      libelle: libelle || domaine,
    });
  } catch (e) {
    if (e instanceof ErreurImport || e instanceof Error) {
      console.error(`✗ ${path.relative(RACINE, chemin)} — ${e.message}`);
      console.error('Aucun fichier n\'a été écrit.');
      return 1;
    }
    throw e;
  }

  const rapport = validerReferentiel(referentiel);
  if (rapport.erreurs.length) {
    console.error(`✗ ${path.relative(RACINE, chemin)} — le résultat de l'import n'est pas conforme au schéma :`);
    console.error(formaterRapport(rapport, ''));
    console.error('Aucun fichier n\'a été écrit.');
    return 1;
  }
  if (rapport.avertissements.length) {
    console.log(formaterRapport({ erreurs: [], avertissements: rapport.avertissements }, ''));
  }

  const attendu = `${JSON.stringify(referentiel, null, 2)}\n`;

  if (options.verifier) {
    if (!fs.existsSync(sortie)) {
      console.error(`✗ ${path.relative(RACINE, sortie)} n'existe pas.`);
      return 1;
    }
    if (fs.readFileSync(sortie, 'utf8') !== attendu) {
      console.error(`✗ ${path.relative(RACINE, sortie)} ne correspond plus à ${path.relative(RACINE, chemin)}.`);
      return 1;
    }
    console.log(`✓ ${path.relative(RACINE, sortie)} correspond au CSV.`);
    return 0;
  }

  ecrireReferentiel(sortie, referentiel);
  console.log(
    `✓ ${path.relative(RACINE, sortie)} — ${referentiel.entrees.length} entrée(s) importée(s) depuis ${path.relative(RACINE, chemin)}.`,
  );
  const contestees = referentiel.entrees.filter((e) => e.statutValidation === 'conteste');
  if (contestees.length) {
    console.log(
      `  ${contestees.length} entrée(s) contestée(s), laissée(s) sans valeur unique : ${contestees.map((e) => e.id).join(', ')}`,
    );
  }
  return 0;
}

if (require.main === module) {
  process.exitCode = principal(process.argv.slice(2));
}

module.exports = { principal };
