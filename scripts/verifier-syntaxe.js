#!/usr/bin/env node
/**
 * Contrôle de syntaxe de tout le JavaScript du dépôt.
 *
 * Le dépôt n'a aucune dépendance et aucune étape de compilation : une erreur de
 * syntaxe ne se voit donc qu'à l'exécution, dans le navigateur, chez
 * l'utilisateur. Les tests couvrent les six simulateurs, mais pas les scripts
 * d'outillage, ni les fichiers générés, ni les pages qui n'ont pas de test.
 *
 * Ce contrôle compile chaque source sans l'exécuter. Il détecte la parenthèse
 * manquante, jamais une erreur de calcul : c'est un garde-fou, pas un test.
 *
 * Sont contrôlés :
 * - les fichiers `.js` de `scripts/`, `src/` et `tests/` ;
 * - le JavaScript embarqué dans les pages HTML de la racine et de `docs/`.
 *
 * Usage : node scripts/verifier-syntaxe.js
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const RACINE = path.resolve(__dirname, '..');

/** Dossiers explorés pour les fichiers `.js`. */
const DOSSIERS_JS = ['scripts', 'src', 'tests'];

/** Dossiers explorés pour les pages HTML. Non récursif. */
const DOSSIERS_HTML = ['.', 'docs'];

/** Dossiers jamais explorés, quel que soit leur emplacement. */
const IGNORES = new Set(['node_modules', '.git']);

/** Liste récursivement les fichiers `.js` d'un dossier. */
function fichiersJs(dossier) {
  const absolu = path.join(RACINE, dossier);
  if (!fs.existsSync(absolu)) return [];

  const trouves = [];
  for (const entree of fs.readdirSync(absolu, { withFileTypes: true })) {
    if (IGNORES.has(entree.name)) continue;
    const relatif = path.join(dossier, entree.name);
    if (entree.isDirectory()) {
      trouves.push(...fichiersJs(relatif));
    } else if (entree.name.endsWith('.js')) {
      trouves.push(relatif);
    }
  }
  return trouves;
}

/** Liste les pages HTML d'un dossier, sans descendre dans ses sous-dossiers. */
function fichiersHtml(dossier) {
  const absolu = path.join(RACINE, dossier);
  if (!fs.existsSync(absolu)) return [];

  return fs.readdirSync(absolu, { withFileTypes: true })
    .filter((entree) => entree.isFile() && entree.name.endsWith('.html'))
    .map((entree) => path.join(dossier === '.' ? '' : dossier, entree.name));
}

/**
 * Extrait le JavaScript embarqué d'une page, avec le numéro de la ligne où
 * chaque bloc commence.
 *
 * La ligne permet de situer l'erreur dans le fichier HTML : sans elle, le
 * message pointerait la ligne 12 d'un bloc dont le lecteur ignore où il débute.
 * Les balises `<script src>` sont ignorées : leur cible est contrôlée en tant
 * que fichier `.js`.
 */
function scriptsEmbarques(html) {
  const blocs = [];
  const motif = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let correspondance;
  while ((correspondance = motif.exec(html)) !== null) {
    const attributs = correspondance[1];
    if (/\bsrc\s*=/i.test(attributs)) continue;
    // Un type non exécutable (`application/json`, `text/template`) n'est pas du
    // JavaScript : le compiler produirait une erreur qui n'en est pas une.
    const type = /\btype\s*=\s*["']([^"']+)["']/i.exec(attributs);
    if (type && !/^(?:text|application)\/javascript$|^module$/i.test(type[1].trim())) {
      continue;
    }
    const avant = html.slice(0, correspondance.index);
    blocs.push({
      source: correspondance[2],
      ligne: avant.split('\n').length,
    });
  }
  return blocs;
}

/**
 * Compile une source sans l'exécuter et retourne le message d'erreur, ou `null`.
 *
 * L'enveloppe reproduit celle que Node applique aux modules CommonJS : sans
 * elle, un `return` au premier niveau serait signalé comme une erreur alors
 * qu'il est licite dans un module.
 */
function erreurDeSyntaxe(source, nom, { enveloppeCommonJs }) {
  // Node retire lui-même la ligne `#!` d'un script exécutable ; le compilateur,
  // lui, la refuse. La neutraliser en commentaire préserve la numérotation.
  const sansShebang = source.startsWith('#!') ? `//${source.slice(2)}` : source;
  const code = enveloppeCommonJs
    ? `(function (exports, require, module, __filename, __dirname) {${sansShebang}\n});`
    : sansShebang;
  try {
    new vm.Script(code, { filename: nom });
    return null;
  } catch (erreur) {
    return erreur.message;
  }
}

function main() {
  const echecs = [];
  let controles = 0;

  for (const dossier of DOSSIERS_JS) {
    for (const relatif of fichiersJs(dossier)) {
      controles += 1;
      const source = fs.readFileSync(path.join(RACINE, relatif), 'utf8');
      const message = erreurDeSyntaxe(source, relatif, { enveloppeCommonJs: true });
      if (message) echecs.push({ fichier: relatif, message });
    }
  }

  for (const dossier of DOSSIERS_HTML) {
    for (const relatif of fichiersHtml(dossier)) {
      const html = fs.readFileSync(path.join(RACINE, relatif), 'utf8');
      for (const bloc of scriptsEmbarques(html)) {
        controles += 1;
        const nom = `${relatif} (script ligne ${bloc.ligne})`;
        const message = erreurDeSyntaxe(bloc.source, nom, { enveloppeCommonJs: false });
        if (message) echecs.push({ fichier: nom, message });
      }
    }
  }

  if (echecs.length > 0) {
    console.error(`Syntaxe : ${echecs.length} source(s) invalide(s) sur ${controles}.`);
    for (const echec of echecs) {
      console.error(`  ${echec.fichier}`);
      console.error(`    ${echec.message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Syntaxe : ${controles} source(s) contrôlée(s), aucune erreur.`);
}

main();
