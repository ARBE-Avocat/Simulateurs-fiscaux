#!/usr/bin/env node
/**
 * Valide tous les référentiels de `data/referentiels/` (issue #18).
 *
 *   npm run donnees:valider
 *   node scripts/valider-referentiels.js data/referentiels/ir.json
 *
 * Sort en code 1 dès qu'une erreur est trouvée, afin qu'une donnée invalide
 * fasse échouer la commande — et demain l'intégration continue — plutôt que
 * d'atteindre un simulateur.
 *
 * Les avertissements n'arrêtent pas la commande : ils décrivent des situations
 * réellement présentes dans les données actuelles, comme un barème dont les
 * tranches laissent un intervalle non couvert.
 */

'use strict';

const path = require('node:path');

const { validerReferentiel, formaterRapport } = require('./lib/schema-referentiel');
const { listerReferentiels, lireReferentiel, RACINE } = require('./lib/referentiels');

function principal(arguments_) {
  const fichiers = arguments_.length
    ? arguments_.map((f) => path.resolve(f))
    : listerReferentiels();

  if (fichiers.length === 0) {
    console.log('Aucun référentiel dans data/referentiels/ : rien à valider.');
    return 0;
  }

  let erreurs = 0;
  let avertissements = 0;

  for (const fichier of fichiers) {
    const nom = path.relative(RACINE, fichier);
    let referentiel;
    try {
      referentiel = lireReferentiel(fichier);
    } catch (e) {
      console.error(`✗ ${nom} — JSON illisible : ${e.message}`);
      erreurs += 1;
      continue;
    }
    const rapport = validerReferentiel(referentiel);
    erreurs += rapport.erreurs.length;
    avertissements += rapport.avertissements.length;

    if (rapport.erreurs.length === 0 && rapport.avertissements.length === 0) {
      console.log(`✓ ${nom}`);
    } else {
      console.log(`${rapport.erreurs.length ? '✗' : '⚠'} ${nom}`);
      console.log(formaterRapport(rapport, ''));
    }
  }

  console.log(
    `\n${fichiers.length} référentiel(s) — ${erreurs} erreur(s), ${avertissements} avertissement(s).`,
  );
  if (erreurs) {
    console.error('\nLes données ne sont pas conformes au schéma. Rien n\'a été modifié.');
    return 1;
  }
  return 0;
}

if (require.main === module) {
  process.exitCode = principal(process.argv.slice(2));
}

module.exports = { principal };
