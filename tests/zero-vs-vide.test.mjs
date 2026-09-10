// Tests du correctif « zéro vs champ vide » (issue #8).
// Exécution depuis la racine du dépôt : node --test tests/
// Aucune dépendance : node:test + vm, avec un DOM minimal simulé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FICHIERS = [
  'Simulation IFI - Avril 2026.html',
  'Simulation Succession.html',
  'Simulation démembrement immo - Juin 2026.html',
];

function lireHtml(nom) {
  return readFileSync(path.join(racine, nom), 'utf8');
}

function extraireFonction(source, nom) {
  const debut = source.indexOf(`function ${nom}(`);
  assert.ok(debut !== -1, `fonction ${nom} introuvable`);
  let i = source.indexOf('{', debut);
  let profondeur = 0;
  for (let j = i; j < source.length; j++) {
    if (source[j] === '{') profondeur++;
    else if (source[j] === '}') {
      profondeur--;
      if (profondeur === 0) return source.slice(debut, j + 1);
    }
  }
  throw new Error(`accolades non équilibrées pour ${nom}`);
}

// Charge nombreOu() depuis le bloc <script> inline du fichier donné
// (la fonction seule : le reste du script exige le DOM du navigateur).
function chargerNombreOu(nom) {
  const html = lireHtml(nom);
  const bloc = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(bloc, `bloc <script> introuvable dans ${nom}`);
  const source = extraireFonction(bloc[1], 'nombreOu');
  const contexte = vm.createContext({ console });
  vm.runInContext(source + '\nthis.__nombreOu = nombreOu;', contexte);
  assert.equal(typeof contexte.__nombreOu, 'function', `nombreOu absente de ${nom}`);
  return contexte.__nombreOu;
}

for (const nom of FICHIERS) {
  test(`nombreOu distingue vide, zéro, négatif, invalide et positif (${nom})`, () => {
    const nombreOu = chargerNombreOu(nom);
    assert.equal(nombreOu('', 100), 100, 'champ vide -> valeur par défaut');
    assert.equal(nombreOu('0', 100), 0, 'zéro saisi reste zéro');
    assert.equal(nombreOu('-5', 100), -5, 'valeur négative conservée');
    assert.equal(nombreOu('abc', 100), 100, 'texte invalide -> valeur par défaut');
    assert.equal(nombreOu('42', 100), 42, 'valeur positive conservée');
  });

  test(`aucun parseFloat(...)||défaut résiduel (${nom})`, () => {
    const html = lireHtml(nom);
    assert.ok(
      !/parseFloat\([^)]*\)\s*\|\|/.test(html),
      'il reste un parseFloat(...)||défaut qui confond zéro et vide'
    );
  });
}

test('IFI : la quote-part utilise nombreOu avec défaut 100 (jamais de 0 -> 100)', () => {
  const html = lireHtml('Simulation IFI - Avril 2026.html');
  assert.ok(html.includes("nombreOu(this.value,100)"), 'quotePart doit passer par nombreOu');
  assert.ok(!html.includes('parseFloat(this.value)||100'), 'ancien motif quotePart éliminé');
});

test('Démembrement : getParams conserve un abattement à 0', () => {
  const html = lireHtml('Simulation démembrement immo - Juin 2026.html');
  const bloc = html.match(/<script>([\s\S]*?)<\/script>/);
  const source = extraireFonction(bloc[1], 'getParams') + '\n' + extraireFonction(bloc[1], 'nombreOu');
  const valeurs = { p_aba_directe: '0' }; // saisie explicite de zéro
  const contexte = vm.createContext({
    console,
    document: { getElementById: (id) => ({ value: valeurs[id] ?? '' }) },
  });
  vm.runInContext(source + '\nthis.__p = getParams();', contexte);
  assert.equal(contexte.__p.aba_directe, 0, 'abattement 0 ne doit pas redevenir 100000');
  assert.equal(contexte.__p.aba_frere, 15932, 'champ vide -> défaut légal');
});

test('Succession : frais funéraires à 0 restent 0, champ vide -> forfait 1500', () => {
  const html = lireHtml('Simulation Succession.html');
  const bloc = html.match(/<script>([\s\S]*?)<\/script>/);
  const source = ['nombreOu', 'val', 'pf', 'calcPassif']
    .map((n) => extraireFonction(bloc[1], n))
    .join('\n');
  const saisies = {};
  const contexte = vm.createContext({
    console,
    document: { getElementById: (id) => ({ value: saisies[id] ?? '' }) },
  });
  vm.runInContext(source + '\nthis.__calc = calcPassif;', contexte);
  saisies['passifFuneraires'] = '0';
  assert.equal(contexte.__calc(), 0, 'frais funéraires 0 ne doivent pas redevenir 1500');
  saisies['passifFuneraires'] = '';
  assert.equal(contexte.__calc(), 1500, 'champ vide -> forfait 1500');
});
