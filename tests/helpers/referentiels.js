/**
 * Lecture des référentiels générés depuis les tests.
 *
 * Les simulateurs les chargent par des balises `<script>` ; en Node, on
 * reconstitue le même contexte : le fichier généré du domaine s'y enregistre,
 * puis `src/lecture-referentiels.js` fournit le lecteur. Les tests exercent
 * ainsi exactement le code que le navigateur exécute, plutôt qu'un chemin
 * parallèle qui pourrait diverger.
 */

const fs = require('node:fs');
const vm = require('node:vm');

const { chemin } = require('./simulateurs');

const MANIFESTE = JSON.parse(
  fs.readFileSync(chemin('src', 'genere', 'referentiels', 'manifeste.json'), 'utf8'),
);

/** Domaines générés, triés. */
function domaines() {
  return Object.keys(MANIFESTE.domaines).sort();
}

/** Description d'un domaine dans le manifeste : fichier, entrées, simulateurs. */
function description(domaine) {
  const trouve = MANIFESTE.domaines[domaine];
  if (!trouve) throw new Error(`Domaine absent du manifeste : ${domaine}`);
  return trouve;
}

/**
 * Ouvre un lecteur pour un ou plusieurs domaines.
 *
 * Appelé sans domaine, il n'en charge aucun : c'est ainsi qu'on vérifie le
 * message d'erreur d'une page qui aurait oublié une balise `<script>`.
 */
function contexteAvec(...domainesCharges) {
  const contexte = {};
  for (const domaine of domainesCharges) {
    vm.runInNewContext(
      fs.readFileSync(chemin(description(domaine).fichier), 'utf8'),
      contexte,
      { filename: description(domaine).fichier },
    );
  }
  vm.runInNewContext(
    fs.readFileSync(chemin('src', 'lecture-referentiels.js'), 'utf8'),
    contexte,
    { filename: 'src/lecture-referentiels.js' },
  );
  return contexte;
}

/** Raccourci : le lecteur d'un domaine, chargé seul. */
function lecteur(domaine) {
  return contexteAvec(domaine).LectureReferentiels.lecteur(domaine);
}

module.exports = { MANIFESTE, domaines, description, contexteAvec, lecteur };
