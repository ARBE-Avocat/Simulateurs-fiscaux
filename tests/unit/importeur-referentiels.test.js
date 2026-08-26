/**
 * Tests de la chaîne d'import et de validation des référentiels (issue #18).
 *
 * L'enjeu de cette chaîne est de remplacer « envoyer un CSV à une IA pour
 * qu'elle réécrive le HTML » par une opération reproductible. Deux propriétés
 * comptent donc plus que les autres, et sont testées en premier :
 *
 * 1. une donnée invalide fait échouer la commande **sans rien écrire** ;
 * 2. le même CSV produit toujours exactement le même fichier.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { lireCsv } = require('../../scripts/lib/csv');
const { importer, ErreurImport } = require('../../scripts/lib/importer');
const { validerReferentiel } = require('../../scripts/lib/schema-referentiel');
const { principal: importerCli } = require('../../scripts/importer-referentiel');
const { chemin } = require('../helpers/simulateurs');

const EXEMPLE = chemin('data', 'imports', 'exemple-dmtg.csv');
const EXEMPLE_INVALIDE = chemin('data', 'imports', 'exemple-invalide-taux-en-pourcentage.csv');

const ENTETE = { domaine: 'exemple-dmtg', libelle: 'Exemple' };

function lireExemple(fichier = EXEMPLE) {
  return fs.readFileSync(fichier, 'utf8');
}

function dossierTemporaire() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'referentiels-'));
}

// ── Lecture du CSV ──────────────────────────────────────────────────────────

test('CSV — un champ entre guillemets peut contenir le séparateur', () => {
  const { lignes } = lireCsv('a;b\n1;"deux;points"\n');
  assert.equal(lignes[0].valeurs.b, 'deux;points');
});

test('CSV — le BOM ajouté par un tableur ne masque pas la première colonne', () => {
  const { entetes } = lireCsv('﻿id;libelle\nx;y\n');
  assert.equal(entetes[0], 'id');
});

test('CSV — une ligne qui n\'a pas le bon nombre de colonnes est refusée', () => {
  // Un point-virgule oublié dans un libellé décalerait silencieusement toutes
  // les colonnes suivantes. Mieux vaut un refus qu'une donnée déplacée.
  assert.throws(() => lireCsv('a;b;c\n1;2\n'), /2 colonnes au lieu de 3/);
});

// ── Import ──────────────────────────────────────────────────────────────────

test('import — le CSV d\'exemple produit un référentiel conforme au schéma', () => {
  const referentiel = importer(lireExemple(), ENTETE);
  const rapport = validerReferentiel(referentiel);
  assert.deepEqual(rapport.erreurs, []);
  assert.deepEqual(rapport.avertissements, []);
});

test('import — une colonne de source vide devient « inconnue », jamais une valeur inventée', () => {
  const referentiel = importer(lireExemple(), ENTETE);
  const sansSource = referentiel.entrees.find((e) => e.id === 'dmtg.abattement.frere-soeur');
  assert.equal(sansSource.source, 'inconnue');
  assert.equal(sansSource.dateEffet, 'inconnue');
});

test('import — une tranche sans limite haute s\'écrit null, pas Infinity', () => {
  const bareme = importer(lireExemple(), ENTETE).entrees.find((e) => e.type === 'bareme');
  const derniere = bareme.valeur[bareme.valeur.length - 1];
  assert.equal(derniere.borneSup, null);
  assert.equal(JSON.stringify(bareme.valeur).includes('Infinity'), false);
});

test('import — une divergence devient une entrée contestée, sans valeur unique', () => {
  const contestee = importer(lireExemple(), ENTETE).entrees.find(
    (e) => e.statutValidation === 'conteste',
  );
  assert.ok(contestee, 'le CSV d\'exemple contient une règle contestée');
  assert.equal(contestee.valeur, undefined);
  assert.deepEqual(contestee.variantes.map((v) => v.valeur).sort(), [0.172, 0.186]);
  assert.ok(contestee.arbitrage.question.length > 0);
});

test('import — le résultat ne dépend pas de l\'ordre des lignes du CSV', () => {
  // Sans cette garantie, réordonner un CSV produirait un diff illisible dans la
  // pull request alors que rien n'aurait changé.
  const lignes = lireExemple().trimEnd().split('\n');
  const melange = [lignes[0], ...lignes.slice(1).reverse()].join('\n') + '\n';

  assert.deepEqual(importer(melange, ENTETE), importer(lireExemple(), ENTETE));
});

test('import — deux lignes d\'une même entrée ne peuvent pas se contredire', () => {
  const lignes = lireExemple().trimEnd().split('\n');
  const index = lignes.findIndex((l, i) => i > 0 && l.startsWith('dmtg.bareme.ligne-directe'));
  lignes[index] = lignes[index].replace('Barème en ligne directe', 'Barème modifié');

  assert.throws(() => importer(lignes.join('\n') + '\n', ENTETE), ErreurImport);
});

test('import — une colonne inconnue fait échouer l\'import', () => {
  // Une colonne mal orthographiée serait sinon ignorée en silence, et la donnée
  // qu'elle porte perdue.
  const contenu = lireExemple().replace('sourceReference', 'sourceRefernce');
  assert.throws(() => importer(contenu, ENTETE), /colonnes inconnues/);
});

test('import — un taux écrit en pourcentage est refusé', () => {
  const referentiel = importer(lireExemple(EXEMPLE_INVALIDE), { domaine: 'x', libelle: 'x' });
  const rapport = validerReferentiel(referentiel);
  assert.ok(
    rapport.erreurs.some((e) => /taux hors plage/.test(e.message)),
    'un taux de 17,2 écrit au lieu de 0,172 doit être détecté',
  );
});

// ── Commande ────────────────────────────────────────────────────────────────

test('commande — un CSV invalide échoue sans écrire de référentiel', () => {
  const dossier = dossierTemporaire();
  const sortie = path.join(dossier, 'resultat.json');

  const code = importerCli([EXEMPLE_INVALIDE, '--domaine', 'x', '--sortie', sortie]);

  assert.equal(code, 1, 'la commande doit échouer');
  assert.equal(fs.existsSync(sortie), false, 'aucun fichier ne doit être écrit');
});

test('commande — deux imports successifs produisent un fichier identique', () => {
  const dossier = dossierTemporaire();
  const sortie = path.join(dossier, 'resultat.json');
  const arguments_ = [EXEMPLE, '--domaine', 'exemple-dmtg', '--sortie', sortie];

  assert.equal(importerCli(arguments_), 0);
  const premier = fs.readFileSync(sortie, 'utf8');
  assert.equal(importerCli(arguments_), 0);

  assert.equal(fs.readFileSync(sortie, 'utf8'), premier);
  assert.equal(importerCli([...arguments_, '--verifier']), 0);
});

test('commande — --verifier signale un référentiel qui ne correspond plus au CSV', () => {
  const dossier = dossierTemporaire();
  const sortie = path.join(dossier, 'resultat.json');
  const arguments_ = [EXEMPLE, '--domaine', 'exemple-dmtg', '--sortie', sortie];

  assert.equal(importerCli(arguments_), 0);
  const modifie = JSON.parse(fs.readFileSync(sortie, 'utf8'));
  modifie.entrees[0].valeur = 999;
  fs.writeFileSync(sortie, `${JSON.stringify(modifie, null, 2)}\n`);

  assert.equal(importerCli([...arguments_, '--verifier']), 1);
});

test('import — deux variantes ne peuvent pas poser deux questions différentes', () => {
  const lignes = lireExemple().trimEnd().split('\n');
  const index = lignes.findIndex((l, i) => i > 0 && l.startsWith('ps.taux.plus-values'));
  lignes[index + 1] = lignes[index + 1].replace(
    "Quel taux s'applique",
    "Une question formulée autrement, quel taux s'applique",
  );

  assert.throws(() => importer(lignes.join('\n') + '\n', ENTETE), ErreurImport);
});

// ── Génération ──────────────────────────────────────────────────────────────

test('génération — le fichier généré correspond au contenu de data/', () => {
  // C'est ce contrôle qui rend visible une modification manuelle du fichier
  // généré, interdite par AGENTS.md §7.
  const { principal: genererCli } = require('../../scripts/generer-referentiels');
  assert.equal(genererCli(['--verifier']), 0);
});

test('génération — le fichier produit est lisible par Node et par un navigateur', () => {
  const { construire } = require('../../scripts/generer-referentiels');
  const contenu = construire({ exemple: { schema: 1, domaine: 'exemple', entrees: [] } });

  assert.match(contenu, /NE PAS MODIFIER À LA MAIN/);
  assert.match(contenu, /module\.exports = REFERENTIELS/);
  assert.match(contenu, /global\.REFERENTIELS = REFERENTIELS/);
  assert.equal(contenu.includes('Infinity'), false);

  // Le fichier doit s'évaluer sans erreur dans un contexte sans `module`,
  // c'est-à-dire comme le ferait une balise <script> dans le navigateur.
  const vm = require('node:vm');
  const global_ = {};
  vm.runInNewContext(contenu, global_, { filename: 'referentiels.js' });
  assert.deepEqual(Object.keys(global_.REFERENTIELS), ['exemple']);
});

test('import — une table est lue depuis du JSON, et un JSON invalide est refusé', () => {
  // Le type `table` sert aux règles qui ne sont ni un nombre ni un barème : les
  // paliers de surtaxe de la plus-value immobilière, par exemple.
  const entete = { domaine: 'exemple', libelle: 'Exemple' };
  const colonnes = 'id;libelle;type;unite;millesime;dateEffet;statutValidation;utilisePar;valeur';
  const ligne = (valeur) => `${colonnes}\n`
    + `x.paliers;Paliers;table;sans-unite;2025;;non-valide;irpp;${valeur}\n`;

  const referentiel = importer(ligne('"[{""plafond"":100,""taux"":0.02}]"'), entete);
  assert.deepEqual(referentiel.entrees[0].valeur, [{ plafond: 100, taux: 0.02 }]);

  assert.throws(() => importer(ligne('pas du json'), entete), /JSON invalide/);
  assert.throws(() => importer(ligne('"[]"'), entete), /non vide/);
});
