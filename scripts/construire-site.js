#!/usr/bin/env node
/**
 * Construit le site publiable dans `site/` (étape M3 de
 * `docs/ARCHITECTURE_CIBLE.md`, issue #28 étape 3).
 *
 * Le dépôt et le site ont **la même arborescence** : une page écrite pour
 * fonctionner depuis la racine du dépôt fonctionne telle quelle une fois
 * publiée. Le build ne réécrit donc aucun chemin ; il se contente de :
 *
 * 1. vider `site/` ;
 * 2. copier la liste blanche de ce qui est livré — et rien d'autre : ni
 *    `docs/`, ni `tests/`, ni `data/referentiels/`. Ce qui n'est pas dans
 *    `site/` n'est pas publiable, par construction ;
 * 3. produire une page de redirection pour chaque ancienne adresse ;
 * 4. vérifier que chaque lien et chaque `<script src>` relatif des pages
 *    livrées pointe vers un fichier réellement livré.
 *
 * Usage : node scripts/construire-site.js [--verifier]
 *   --verifier  n'écrit rien : reconstruit en mémoire et échoue si un lien est
 *               cassé ou si un élément de la liste blanche manque.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { ANCIENNES_ADRESSES, pageDeRedirection } = require('./lib/redirections');

const RACINE = path.resolve(__dirname, '..');
const SORTIE = path.join(RACINE, 'site');

/**
 * Ce qui est livré, chemin par chemin. Un dossier est copié récursivement.
 *
 * `data/change/` est la seule partie de `data/` livrée : c'est le repli des
 * taux de change, lu par le navigateur quand la BCE ne répond pas. Les
 * référentiels fiscaux, eux, arrivent au navigateur par `src/genere/`.
 */
const LIVRES = [
  'index.html',
  'simulateurs',
  'src',
  'data/change',
];

/** Liste récursivement les fichiers d'un dossier, en chemins relatifs POSIX. */
function fichiersDe(dossier) {
  const absolu = path.join(RACINE, dossier);
  const stat = fs.statSync(absolu);
  if (stat.isFile()) return [dossier];
  const trouves = [];
  for (const entree of fs.readdirSync(absolu, { withFileTypes: true })) {
    const relatif = `${dossier}/${entree.name}`;
    if (entree.isDirectory()) trouves.push(...fichiersDe(relatif));
    else trouves.push(relatif);
  }
  return trouves;
}

/** Inventaire complet des fichiers livrés : chemin publié → chemin source. */
function inventaire() {
  const fichiers = new Map();
  for (const element of LIVRES) {
    if (!fs.existsSync(path.join(RACINE, element))) {
      throw new Error(`Élément à livrer introuvable : ${element}`);
    }
    for (const fichier of fichiersDe(element)) fichiers.set(fichier, fichier);
  }
  return fichiers;
}

/**
 * Références relatives d'une page : liens et scripts, hors adresses externes,
 * ancres et `mailto:`. Un lien vers un dossier vaut son `index.html`.
 */
function referencesRelatives(html) {
  const references = [];
  const motif = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let correspondance;
  while ((correspondance = motif.exec(html)) !== null) {
    const valeur = correspondance[1];
    if (/^(?:[a-z]+:|\/\/|#)/i.test(valeur)) continue;
    references.push(decodeURIComponent(valeur.split('#')[0].split('?')[0]));
  }
  return references;
}

/** Vérifie que toute référence relative d'une page livrée vise un fichier livré. */
function liensCasses(fichiers) {
  const casses = [];
  for (const [publie] of fichiers) {
    if (!publie.endsWith('.html')) continue;
    const html = fs.readFileSync(path.join(RACINE, publie), 'utf8');
    const dossier = path.posix.dirname(publie);
    for (const reference of referencesRelatives(html)) {
      let cible = path.posix.normalize(path.posix.join(dossier, reference));
      if (reference.endsWith('/')) cible = path.posix.join(cible, 'index.html');
      if (cible.startsWith('..')) {
        casses.push(`${publie} → ${reference} sort du site`);
      } else if (!fichiers.has(cible)) {
        casses.push(`${publie} → ${reference} (${cible} n'est pas livré)`);
      }
    }
  }
  return casses;
}

function construire({ verifierSeulement }) {
  const fichiers = inventaire();
  const casses = liensCasses(fichiers);
  if (casses.length > 0) {
    console.error(`Site : ${casses.length} lien(s) cassé(s) dans les pages livrées.`);
    for (const c of casses) console.error(`  ${c}`);
    process.exitCode = 1;
    return;
  }

  for (const ancien of Object.keys(ANCIENNES_ADRESSES)) {
    if (fichiers.has(ancien)) {
      throw new Error(`Conflit : ${ancien} est à la fois livré et redirigé.`);
    }
    const cible = ANCIENNES_ADRESSES[ancien];
    if (!fichiers.has(path.posix.join(cible, 'index.html'))) {
      throw new Error(`Redirection ${ancien} → ${cible} : la cible n'est pas livrée.`);
    }
  }

  if (verifierSeulement) {
    console.log(`Site : ${fichiers.size} fichier(s) à livrer, ${Object.keys(ANCIENNES_ADRESSES).length} redirection(s), aucun lien cassé.`);
    return;
  }

  fs.rmSync(SORTIE, { recursive: true, force: true });
  for (const [publie, source] of fichiers) {
    const destination = path.join(SORTIE, publie);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(RACINE, source), destination);
  }
  for (const [ancien, cible] of Object.entries(ANCIENNES_ADRESSES)) {
    fs.writeFileSync(path.join(SORTIE, ancien), pageDeRedirection(cible), 'utf8');
  }
  // GitHub Pages construirait sinon le site avec Jekyll, qui ignore certains
  // fichiers et dossiers. Ce marqueur le désactive.
  fs.writeFileSync(path.join(SORTIE, '.nojekyll'), '', 'utf8');

  console.log(`Site : ${fichiers.size} fichier(s) copié(s) et ${Object.keys(ANCIENNES_ADRESSES).length} redirection(s) écrites dans site/.`);
}

if (require.main === module) {
  construire({ verifierSeulement: process.argv.includes('--verifier') });
}

module.exports = { LIVRES, inventaire, liensCasses, referencesRelatives };
