/**
 * Détection des identifiants mélangeant plusieurs alphabets.
 *
 * Certaines lettres cyrilliques ou grecques sont visuellement identiques à des
 * lettres latines : `а` (cyrillique) et `a` (latin) s'affichent pareil mais
 * sont deux caractères différents. Un nom de variable qui en contient
 * ressemble à un autre nom sans en être un, et le bogue est invisible à la
 * relecture.
 *
 * Le contrôle repère les endroits où une lettre latine touche directement une
 * lettre cyrillique ou grecque, c'est-à-dire un mot écrit dans deux alphabets.
 * Un texte français reste en alphabet latin et un mot entièrement grec dans une
 * chaîne de caractères ne déclenche rien : seul le mélange est signalé.
 */

// Plages Unicode : grec et copte, puis cyrillique et cyrillique complémentaire.
const LETTRES_NON_LATINES = '\\u0370-\\u03FF\\u0400-\\u04FF';
const MOTIF_MELANGE = new RegExp(
  `[A-Za-z][${LETTRES_NON_LATINES}]|[${LETTRES_NON_LATINES}][A-Za-z]`,
  'g'
);

/**
 * Retourne la liste des mélanges d'alphabets trouvés dans un code source.
 * Chaque entrée donne la ligne et un extrait, pour que l'échec soit lisible.
 *
 * @param {string} source code à analyser
 * @returns {{ligne: number, extrait: string}[]}
 */
function trouverMelangesAlphabets(source) {
  const trouvailles = [];
  MOTIF_MELANGE.lastIndex = 0;
  let correspondance;
  while ((correspondance = MOTIF_MELANGE.exec(source)) !== null) {
    const position = correspondance.index;
    const ligne = source.slice(0, position).split('\n').length;
    const debut = Math.max(0, position - 40);
    const extrait = source.slice(debut, position + 40).replace(/\s+/g, ' ').trim();
    trouvailles.push({ ligne, extrait });
  }
  return trouvailles;
}

module.exports = { trouverMelangesAlphabets };
