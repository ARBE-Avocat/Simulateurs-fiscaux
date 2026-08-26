/**
 * Lecture de CSV, sans dépendance.
 *
 * Le format attendu est celui que produisent les tableurs français : séparateur
 * point-virgule, guillemets doubles autour d'un champ contenant un séparateur,
 * un guillemet échappé en le doublant. Un éventuel BOM en tête de fichier est
 * retiré : Excel en ajoute un, et il rendrait la première colonne introuvable.
 */

'use strict';

const SEPARATEUR = ';';

/** Découpe une ligne CSV en champs, en respectant les guillemets. */
function decouper(ligne) {
  const champs = [];
  let courant = '';
  let dansGuillemets = false;

  for (let i = 0; i < ligne.length; i += 1) {
    const c = ligne[i];
    if (dansGuillemets) {
      if (c === '"') {
        if (ligne[i + 1] === '"') {
          courant += '"';
          i += 1;
        } else {
          dansGuillemets = false;
        }
      } else {
        courant += c;
      }
    } else if (c === '"') {
      dansGuillemets = true;
    } else if (c === SEPARATEUR) {
      champs.push(courant);
      courant = '';
    } else {
      courant += c;
    }
  }
  champs.push(courant);
  return champs;
}

/**
 * Analyse un CSV et retourne ses lignes sous forme d'objets.
 *
 * @param {string} contenu texte du fichier
 * @returns {{entetes: string[], lignes: Array<{numero: number, valeurs: Object}>}}
 */
function lireCsv(contenu) {
  const texte = contenu.replace(/^﻿/, '');
  const brutes = texte.split(/\r?\n/);

  let indexEntete = -1;
  for (let i = 0; i < brutes.length; i += 1) {
    if (brutes[i].trim() !== '') {
      indexEntete = i;
      break;
    }
  }
  if (indexEntete === -1) {
    throw new Error('CSV vide : aucune ligne d\'en-tête');
  }

  const entetes = decouper(brutes[indexEntete]).map((e) => e.trim());
  const doublons = entetes.filter((e, i) => entetes.indexOf(e) !== i);
  if (doublons.length) {
    throw new Error(`colonnes en double dans l'en-tête : ${[...new Set(doublons)].join(', ')}`);
  }

  const lignes = [];
  for (let i = indexEntete + 1; i < brutes.length; i += 1) {
    const brute = brutes[i];
    if (brute.trim() === '') continue;
    const champs = decouper(brute);
    if (champs.length !== entetes.length) {
      throw new Error(
        `ligne ${i + 1} : ${champs.length} colonnes au lieu de ${entetes.length}`,
      );
    }
    const valeurs = {};
    entetes.forEach((entete, j) => {
      valeurs[entete] = champs[j].trim();
    });
    lignes.push({ numero: i + 1, valeurs });
  }

  return { entetes, lignes };
}

module.exports = { lireCsv, decouper, SEPARATEUR };
