/**
 * Accès aux taux de change (issue #13).
 *
 * Les taux ne sont pas une donnée fiscale : ils ne portent ni date d'effet, ni
 * statut de validation au sens de `data/schema/README.md`. Ils ont donc leur
 * propre format et leur propre validation, plutôt qu'un schéma fiscal forcé.
 *
 * Un fichier par année, pour que le navigateur ne télécharge que ce dont il a
 * besoin : la série complète pèse près de 4 Mo, une année quelques dizaines de
 * kilo-octets.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.resolve(__dirname, '..', '..');
const DOSSIER_CHANGE = path.join(RACINE, 'data', 'change');
const FICHIER_MANIFESTE = path.join(DOSSIER_CHANGE, 'manifeste.json');

const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RE_DEVISE = /^[A-Z]{3}$/;

/** Chemin du fichier d'une année, relatif à la racine du dépôt. */
function cheminAnnee(annee) {
  return path.posix.join('data', 'change', `${annee}.json`);
}

function listerAnnees(dossier = DOSSIER_CHANGE) {
  if (!fs.existsSync(dossier)) return [];
  return fs
    .readdirSync(dossier)
    .filter((f) => /^\d{4}\.json$/.test(f))
    .map((f) => Number(f.slice(0, 4)))
    .sort((a, b) => a - b);
}

function lireAnnee(annee, dossier = DOSSIER_CHANGE) {
  return JSON.parse(fs.readFileSync(path.join(dossier, `${annee}.json`), 'utf8'));
}

/**
 * Sérialise une année avec une date par ligne.
 *
 * Une mise en forme indentée quadruplerait le volume ; une seule ligne rendrait
 * tout diff illisible. Une date par ligne garde les deux qualités : le fichier
 * reste compact, et l'ajout d'une cotation se lit comme une ligne ajoutée.
 */
function serialiserAnnee(contenu) {
  const dates = Object.keys(contenu.cotations).sort();
  const lignes = dates.map(
    (d) => `    ${JSON.stringify(d)}: ${JSON.stringify(contenu.cotations[d])}`,
  );
  return [
    '{',
    `  "schema": ${JSON.stringify(contenu.schema)},`,
    `  "domaine": ${JSON.stringify(contenu.domaine)},`,
    `  "annee": ${JSON.stringify(contenu.annee)},`,
    `  "source": ${JSON.stringify(contenu.source)},`,
    `  "devises": ${JSON.stringify(contenu.devises)},`,
    `  "joursNonCotes": ${JSON.stringify(contenu.joursNonCotes)},`,
    '  "cotations": {',
    lignes.join(',\n'),
    '  }',
    '}',
    '',
  ].join('\n');
}

function ecrireAnnee(contenu, dossier = DOSSIER_CHANGE) {
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, `${contenu.annee}.json`), serialiserAnnee(contenu), 'utf8');
}

/**
 * Valide une année de cotations.
 *
 * Contrôle la forme et la cohérence : dates de l'année déclarée, devises
 * connues, taux strictement positifs, aucun chevauchement entre jours cotés et
 * jours non cotés. Ne vérifie évidemment pas qu'un taux est le bon.
 */
function validerAnnee(contenu) {
  const erreurs = [];
  const avertissements = [];
  const erreur = (chemin, message) => erreurs.push({ chemin, message });

  if (contenu.schema !== 1) erreur('.schema', 'version de schéma attendue : 1');
  if (contenu.domaine !== 'change') erreur('.domaine', 'domaine attendu : « change »');
  if (!Number.isInteger(contenu.annee)) {
    erreur('.annee', 'année manquante');
    return { erreurs, avertissements };
  }
  if (!Array.isArray(contenu.devises) || contenu.devises.length === 0) {
    erreur('.devises', 'liste des devises attendue');
  } else {
    contenu.devises.forEach((d, i) => {
      if (!RE_DEVISE.test(d)) erreur(`.devises[${i}]`, `code de devise mal formé : ${d}`);
    });
  }

  const connues = new Set(contenu.devises || []);
  const prefixe = `${contenu.annee}-`;
  const nonCotes = new Set(contenu.joursNonCotes || []);

  nonCotes.forEach((d) => {
    if (!RE_DATE.test(d)) erreur('.joursNonCotes', `date mal formée : ${d}`);
    else if (!d.startsWith(prefixe)) {
      erreur('.joursNonCotes', `${d} n'appartient pas à l'année ${contenu.annee}`);
    }
  });

  if (!contenu.cotations || typeof contenu.cotations !== 'object') {
    erreur('.cotations', 'cotations manquantes');
    return { erreurs, avertissements };
  }

  let taux = 0;
  for (const [date, jour] of Object.entries(contenu.cotations)) {
    if (!RE_DATE.test(date)) { erreur('.cotations', `date mal formée : ${date}`); continue; }
    if (!date.startsWith(prefixe)) {
      erreur('.cotations', `${date} n'appartient pas à l'année ${contenu.annee}`);
      continue;
    }
    if (nonCotes.has(date)) {
      erreur('.cotations', `${date} figure à la fois comme jour coté et comme jour non coté`);
    }
    if (!jour || typeof jour !== 'object' || Array.isArray(jour)) {
      erreur(`.cotations["${date}"]`, 'objet de taux attendu');
      continue;
    }
    const devises = Object.keys(jour);
    if (devises.length === 0) {
      erreur(`.cotations["${date}"]`, 'jour coté sans aucun taux : il relève de joursNonCotes');
    }
    for (const devise of devises) {
      if (!connues.has(devise)) {
        erreur(`.cotations["${date}"]`, `devise absente de la liste déclarée : ${devise}`);
      }
      const v = jour[devise];
      if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
        erreur(`.cotations["${date}"].${devise}`, `taux invalide : ${JSON.stringify(v)}`);
      }
      taux += 1;
    }
  }

  if (taux === 0) erreur('.cotations', 'aucune cotation');

  return { erreurs, avertissements };
}

function formaterRapport(rapport, nom) {
  return [
    ...rapport.erreurs.map((e) => `  ✗ ${nom}${e.chemin} — ${e.message}`),
    ...rapport.avertissements.map((a) => `  ⚠ ${nom}${a.chemin} — ${a.message}`),
  ].join('\n');
}

module.exports = {
  RACINE,
  DOSSIER_CHANGE,
  FICHIER_MANIFESTE,
  cheminAnnee,
  listerAnnees,
  lireAnnee,
  ecrireAnnee,
  serialiserAnnee,
  validerAnnee,
  formaterRapport,
};
