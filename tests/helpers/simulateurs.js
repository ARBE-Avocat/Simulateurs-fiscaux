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

/**
 * Relève l'état initial des champs d'une page : ce que le HTML affiche avant
 * toute saisie.
 *
 * Le faux DOM crée sinon des champs vides, alors qu'un formulaire pré-rempli
 * porte des valeurs par défaut — bornes de barème, plafonds d'abattement, cases
 * cochées. Les tests décriraient alors un produit qui n'existe pas : un
 * simulateur dont tous les paramètres valent zéro.
 *
 * Trois formes sont relevées : l'attribut `value` d'un champ, l'attribut
 * `checked` d'une case, et l'option `selected` d'une liste déroulante.
 */
function relevesInitiaux(html) {
  const etat = {};

  const champs = /<(input|textarea)\b([^>]*)>/gi;
  let correspondance;
  while ((correspondance = champs.exec(html)) !== null) {
    const attributs = correspondance[2];
    const id = /\bid\s*=\s*["']([^"']+)["']/i.exec(attributs);
    if (!id) continue;
    const entree = {};
    const value = /\bvalue\s*=\s*["']([^"']*)["']/i.exec(attributs);
    if (value) entree.value = value[1];
    if (/\btype\s*=\s*["']checkbox["']/i.test(attributs)
      || /\btype\s*=\s*["']radio["']/i.test(attributs)) {
      entree.checked = /\bchecked\b/i.test(attributs);
    }
    etat[id[1]] = { ...(etat[id[1]] || {}), ...entree };
  }

  const listes = /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;
  while ((correspondance = listes.exec(html)) !== null) {
    const id = /\bid\s*=\s*["']([^"']+)["']/i.exec(correspondance[1]);
    if (!id) continue;
    const options = [...correspondance[2].matchAll(/<option\b([^>]*)>/gi)];
    const choisie = options.find((o) => /\bselected\b/i.test(o[1])) || options[0];
    if (!choisie) continue;
    const valeur = /\bvalue\s*=\s*["']([^"']*)["']/i.exec(choisie[1]);
    if (valeur) etat[id[1]] = { ...(etat[id[1]] || {}), value: valeur[1] };
  }

  return etat;
}

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
 * Extrait le contenu des balises `<script>` embarquées.
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
 * Extrait les scripts référencés par `src`, dans l'ordre du document.
 *
 * Depuis le jalon `0.5`, un simulateur peut charger une ressource partagée —
 * les référentiels fiscaux générés — au lieu de tout embarquer. Le harnais doit
 * donc résoudre ces chemins comme le ferait le navigateur, faute de quoi les
 * données seraient absentes des tests alors qu'elles sont présentes à l'écran.
 *
 * Seuls les chemins relatifs internes au dépôt sont chargés. Une URL externe est
 * ignorée : les tests ne font aucun appel réseau.
 */
function extraireScriptsExternes(html) {
  const chemins = [];
  const motif = /<script\b([^>]*)>/gi;
  let correspondance;
  while ((correspondance = motif.exec(html)) !== null) {
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(correspondance[1]);
    if (!src) continue;
    const valeur = src[1];
    if (/^(?:[a-z]+:)?\/\//i.test(valeur) || valeur.startsWith('data:')) continue;
    chemins.push(valeur);
  }
  return chemins;
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

  const dom = creerFauxDom(relevesInitiaux(html));
  const contexte = vm.createContext(dom.global);

  // Les ressources externes sont exécutées avant les scripts embarqués, comme
  // le fait le navigateur pour des balises `<script>` sans `defer` placées plus
  // haut dans le document.
  for (const relatif of extraireScriptsExternes(html)) {
    const absolu = chemin(relatif);
    if (!fs.existsSync(absolu)) {
      throw new Error(
        `${simulateur(cle).fichier} référence ${relatif}, introuvable. `
          + 'Si c\'est un fichier généré, lancer : npm run donnees:generer',
      );
    }
    vm.runInContext(fs.readFileSync(absolu, 'utf8'), contexte, { filename: relatif });
  }

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
  extraireScriptsExternes,
  lireHtml,
  relevesInitiaux,
  simulateur,
  verifierSyntaxe,
};
