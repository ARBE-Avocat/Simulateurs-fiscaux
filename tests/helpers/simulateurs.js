/**
 * Chargement des simulateurs pour les tests.
 *
 * Les simulateurs sont aujourd'hui des fichiers HTML autonomes : le JavaScript
 * de calcul est embarqué dans une balise `<script>`. Tant que l'architecture
 * cible n'est pas tranchée (issue #20), on ne déplace pas ce code. Ce module
 * lit donc le HTML, en extrait le script et l'exécute dans Node avec un faux
 * DOM minimal, afin de tester les fonctions de calcul sans navigateur.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { creerFauxDom } = require('./dom-minimal');

const RACINE = path.resolve(__dirname, '..', '..');

/**
 * Liste des simulateurs testés.
 *
 * `cle` sert d'identifiant stable dans les tests, `fichier` est le nom réel du
 * fichier HTML. Si un fichier est renommé, cette liste et les liens de
 * `index.html` doivent être mis à jour ensemble.
 */
const SIMULATEURS = [
  { cle: 'ir-cehr-cdhr', fichier: 'Simulateur_IR 2025 et CEHR_CDHR 2026.html' },
  { cle: 'pv-immobiliere', fichier: 'Simulateur_PV_Immobilière Juillet 2026.html' },
  { cle: 'ifi', fichier: 'Simulation IFI - Avril 2026.html' },
  { cle: 'irpp', fichier: 'Simulation IRPP - Avril 2026.html' },
  { cle: 'succession', fichier: 'Simulation Succession.html' },
  { cle: 'demembrement', fichier: 'Simulation démembrement immo - Juin 2026.html' },
];

/** Chemin absolu d'un fichier du dépôt. */
function chemin(...segments) {
  return path.join(RACINE, ...segments);
}

/** Retourne la description d'un simulateur à partir de sa clé. */
function simulateur(cle) {
  const trouve = SIMULATEURS.find((s) => s.cle === cle);
  if (!trouve) {
    throw new Error(`Simulateur inconnu : ${cle}`);
  }
  return trouve;
}

/** Lit le contenu HTML d'un simulateur. */
function lireHtml(cle) {
  return fs.readFileSync(chemin(simulateur(cle).fichier), 'utf8');
}

/**
 * Extrait le contenu des balises `<script>` sans attribut `src`.
 * Retourne un tableau de blocs, dans l'ordre du document.
 */
function extraireScripts(html) {
  const blocs = [];
  const motif = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let correspondance;
  while ((correspondance = motif.exec(html)) !== null) {
    const attributs = correspondance[1];
    if (/\bsrc\s*=/i.test(attributs)) continue;
    blocs.push(correspondance[2]);
  }
  return blocs;
}

/**
 * Charge un simulateur dans un contexte Node isolé.
 *
 * Retourne un objet `{ evaluer, contexte, dom }` :
 * - `evaluer(expression)` exécute une expression JavaScript dans le contexte du
 *   simulateur. C'est le seul moyen d'atteindre les `const` et `function`
 *   déclarées au premier niveau du script, qui ne sont pas des propriétés de
 *   l'objet global.
 * - `dom.document.getElementById(id)` permet de préparer des champs de
 *   formulaire avant d'appeler une fonction qui les lit.
 */
function chargerSimulateur(cle) {
  const html = lireHtml(cle);
  const scripts = extraireScripts(html);
  if (scripts.length === 0) {
    throw new Error(`Aucun script embarqué trouvé dans ${simulateur(cle).fichier}`);
  }

  const dom = creerFauxDom();
  const contexte = vm.createContext(dom.global);

  scripts.forEach((source, index) => {
    // `filename` rend les traces d'erreur lisibles quand un script échoue.
    vm.runInContext(source, contexte, {
      filename: `${simulateur(cle).fichier}#script-${index + 1}`,
    });
  });

  return {
    contexte,
    dom,
    evaluer(expression) {
      return vm.runInContext(`(${expression})`, contexte, {
        filename: `${simulateur(cle).fichier}#evaluation`,
      });
    },
  };
}

/** Vérifie la validité syntaxique d'un script sans l'exécuter. */
function verifierSyntaxe(source, nom) {
  new vm.Script(source, { filename: nom });
}

module.exports = {
  RACINE,
  SIMULATEURS,
  chemin,
  chargerSimulateur,
  extraireScripts,
  lireHtml,
  simulateur,
  verifierSyntaxe,
};
