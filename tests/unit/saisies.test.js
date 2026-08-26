/**
 * Tests du helper de lecture des saisies (issue #8).
 *
 * Règle : une valeur saisie ne doit jamais être corrigée en silence. Seuls un
 * champ vide ou une saisie illisible autorisent la valeur par défaut ; zéro est
 * un nombre comme un autre.
 *
 * Le helper est pour l'instant recopié dans chaque simulateur. Ces tests le
 * vérifient dans les trois simulateurs concernés, ce qui détecte aussi une
 * copie qui aurait divergé.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { chargerSimulateur } = require('../helpers/simulateurs');

const SIMULATEURS_CONCERNES = ['ifi', 'succession', 'demembrement'];

const CAS = [
  { nom: 'champ vide', saisie: '', defaut: 100, attendu: 100 },
  { nom: 'champ contenant des espaces', saisie: '   ', defaut: 100, attendu: 100 },
  { nom: 'valeur absente', saisie: undefined, defaut: 100, attendu: 100 },
  { nom: 'valeur nulle au sens JavaScript', saisie: null, defaut: 100, attendu: 100 },
  { nom: 'texte invalide', saisie: 'abc', defaut: 100, attendu: 100 },
  { nom: 'zéro saisi', saisie: '0', defaut: 100, attendu: 0 },
  { nom: 'zéro décimal saisi', saisie: '0.00', defaut: 100, attendu: 0 },
  { nom: 'valeur positive', saisie: '42.5', defaut: 100, attendu: 42.5 },
  { nom: 'valeur négative', saisie: '-12', defaut: 100, attendu: -12 },
  { nom: 'valeur entourée d’espaces', saisie: ' 7 ', defaut: 100, attendu: 7 },
];

for (const cle of SIMULATEURS_CONCERNES) {
  test(`${cle} — nombreSaisi distingue le vide, l'invalide et le zéro`, async (t) => {
    const nombreSaisi = chargerSimulateur(cle).evaluer('nombreSaisi');
    for (const cas of CAS) {
      await t.test(cas.nom, () => {
        assert.equal(
          nombreSaisi(cas.saisie, cas.defaut),
          cas.attendu,
          `saisie ${JSON.stringify(cas.saisie)} avec défaut ${cas.defaut}`
        );
      });
    }
  });

  test(`${cle} — sans valeur par défaut précisée, un champ vide vaut zéro`, () => {
    const nombreSaisi = chargerSimulateur(cle).evaluer('nombreSaisi');
    assert.equal(nombreSaisi(''), 0);
    assert.equal(nombreSaisi('0'), 0);
    assert.equal(nombreSaisi('5'), 5);
  });
}
