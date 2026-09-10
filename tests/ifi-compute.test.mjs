// Tests du simulateur IFI : initialisation et calcul.
// Exécution depuis la racine du dépôt : node --test tests/
// Aucune dépendance : node:test + vm, avec un DOM minimal simulé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(path.join(racine, 'Simulation IFI - Avril 2026.html'), 'utf8');
const blocScript = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(blocScript, 'bloc <script> introuvable dans le simulateur IFI');
const source = blocScript[1];

// DOM minimal : le script n'utilise que getElementById, createElement et
// window.addEventListener (vérifié par lecture du fichier).
function creerContexte() {
  const elements = new Map();
  const ecouteurs = {};
  const contexte = {
    console,
    document: {
      getElementById(id) {
        if (!elements.has(id)) {
          elements.set(id, { value: '', textContent: '', innerHTML: '' });
        }
        return elements.get(id);
      },
      createElement() {
        return {
          style: {},
          classList: { add() {}, remove() {} },
          setAttribute() {},
          addEventListener() {},
          appendChild() {},
        };
      },
    },
    fetch: () => Promise.reject(new Error('réseau désactivé dans les tests')),
  };
  contexte.window = contexte;
  contexte.addEventListener = (nom, fn) => { ecouteurs[nom] = fn; };
  vm.createContext(contexte);
  vm.runInContext(source, contexte, { filename: 'simulation-ifi.js' });
  return { contexte, elements, ecouteurs };
}

test("initialisation : le script se charge sans contournement global", () => {
  const { contexte, ecouteurs } = creerContexte();
  assert.equal(vm.runInContext('typeof compute', contexte), 'function');
  // Issue #6 : aucune variable globale de patrimoine ne doit survivre.
  assert.equal(
    vm.runInContext('Object.prototype.hasOwnProperty.call(globalThis, "patrimoinebrut")', contexte),
    false,
    'la variable globale patrimoinebrut existe encore'
  );
  // L'alias _compute / redéfinition de window.compute doit disparaître.
  assert.equal(
    vm.runInContext('typeof _compute', contexte),
    'undefined',
    "l'alias _compute existe encore"
  );
  // Le gestionnaire d'initialisation reste bien branché.
  assert.equal(typeof ecouteurs['DOMContentLoaded'], 'function');
});

function calculerAvec(biens) {
  const { contexte } = creerContexte();
  vm.runInContext(`biens = ${JSON.stringify(biens)};`, contexte);
  vm.runInContext('renderResults = function (r) { globalThis.__resultat = r; };', contexte);
  vm.runInContext('compute();', contexte);
  return vm.runInContext('__resultat', contexte);
}

test('calcul : patrimoine de 5 566 000 €, aucune déduction', () => {
  const r = calculerAvec([{ valeur: 5566000, devise: 'EUR', rp: false, decote: false, quotePart: 100 }]);
  assert.equal(r.patrimoinebrut, 5566000);
  assert.equal(r.patrimoineNet, 5566000);
  // Barème sur 5 566 000 € : 42 764,9655 € d'IFI théorique.
  assert.ok(Math.abs(r.ifiTheorique - 42764.9655) < 1e-6, `ifiTheorique inattendu : ${r.ifiTheorique}`);
  // Assiette réelle 5 523 235,0345 € : IFI final 42 230,40343125 €.
  assert.ok(Math.abs(r.ifiFinal - 42230.40343125) < 1e-6, `ifiFinal inattendu : ${r.ifiFinal}`);
  assert.equal(r.decote, 0);
});

test('calcul : 1 000 000 € reste sous le seuil après décote', () => {
  const r = calculerAvec([{ valeur: 1000000, devise: 'EUR', rp: false, decote: false, quotePart: 100 }]);
  assert.equal(r.patrimoineNet, 1000000);
  // Barème 999,995 € - décote 5 000 € -> 0 € d'IFI.
  assert.equal(r.decote, 5000);
  assert.equal(r.ifiFinal, 0);
});

test("calcul : l'abattement de 30 % sur la résidence principale est appliqué", () => {
  const r = calculerAvec([{ valeur: 2000000, devise: 'EUR', rp: true, decote: false, quotePart: 100 }]);
  assert.equal(r.patrimoinebrut, 1400000);
  assert.equal(r.patrimoineNet, 1400000);
});
