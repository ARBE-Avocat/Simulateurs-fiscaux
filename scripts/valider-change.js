#!/usr/bin/env node
/**
 * Valide les taux de change de `data/change/` (issue #13).
 *
 *   npm run change:valider
 *
 * Contrôle la forme et la cohérence de chaque année, puis vérifie que le
 * manifeste décrit bien ce que contiennent les fichiers : c'est lui que la page
 * consulte pour savoir quelles années elle peut demander, et une année absente
 * du manifeste serait invisible.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  DOSSIER_CHANGE,
  FICHIER_MANIFESTE,
  RACINE,
  formaterRapport,
  listerAnnees,
  lireAnnee,
  validerAnnee,
} = require('./lib/change');

function principal() {
  const annees = listerAnnees();
  if (annees.length === 0) {
    console.log('Aucune année dans data/change/ : rien à valider.');
    return 0;
  }

  let erreurs = 0;
  let joursCotes = 0;
  let joursNonCotes = 0;
  const devises = new Set();
  let premiere = null;
  let derniere = null;

  for (const annee of annees) {
    const contenu = lireAnnee(annee);
    const rapport = validerAnnee(contenu);
    if (rapport.erreurs.length) {
      console.log(`✗ ${path.posix.join('data', 'change', `${annee}.json`)}`);
      console.log(formaterRapport(rapport, ''));
      erreurs += rapport.erreurs.length;
      continue;
    }
    const dates = Object.keys(contenu.cotations).sort();
    joursCotes += dates.length;
    joursNonCotes += (contenu.joursNonCotes || []).length;
    contenu.devises.forEach((d) => devises.add(d));
    if (!premiere || dates[0] < premiere) [premiere] = dates;
    if (!derniere || dates[dates.length - 1] > derniere) derniere = dates[dates.length - 1];
  }

  if (erreurs) {
    console.error(`\n${erreurs} erreur(s). Les taux de change ne sont pas conformes.`);
    return 1;
  }

  // Le manifeste est ce que la page consulte : il doit décrire la réalité.
  if (!fs.existsSync(FICHIER_MANIFESTE)) {
    console.error('✗ data/change/manifeste.json est absent.');
    return 1;
  }
  const manifeste = JSON.parse(fs.readFileSync(FICHIER_MANIFESTE, 'utf8'));
  const attendu = {
    annees,
    devises: [...devises].sort(),
    premiereCotation: premiere,
    derniereCotation: derniere,
    joursCotes,
    joursNonCotes,
  };
  const desaccords = Object.keys(attendu).filter(
    (clef) => JSON.stringify(manifeste[clef]) !== JSON.stringify(attendu[clef]),
  );
  if (desaccords.length) {
    desaccords.forEach((clef) => {
      console.error(
        `✗ manifeste.json — « ${clef} » annonce ${JSON.stringify(manifeste[clef])}, `
          + `les fichiers contiennent ${JSON.stringify(attendu[clef])}`,
      );
    });
    return 1;
  }

  console.log(
    `✓ ${annees.length} année(s), de ${premiere} à ${derniere} — `
      + `${joursCotes} jours cotés, ${joursNonCotes} non cotés, ${devises.size} devises.`,
  );
  console.log(`  ${path.relative(RACINE, DOSSIER_CHANGE)}/manifeste.json est à jour.`);
  return 0;
}

if (require.main === module) {
  process.exitCode = principal();
}

module.exports = { principal };
