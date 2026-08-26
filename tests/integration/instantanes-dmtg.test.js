/**
 * Filet de non-régression des simulateurs Succession et Démembrement (#16).
 *
 * Ces scénarios ont été relevés **avant** l'extraction des référentiels DMTG,
 * par exécution réelle des deux simulateurs. Ils ne jugent pas la justesse
 * fiscale d'un barème : ils prouvent qu'une refactorisation ne déplace aucun
 * montant, au centime près.
 *
 * Ils couvrent les neuf liens de parenté, chaque franchissement de tranche du
 * barème en ligne directe, les donations antérieures, l'assurance-vie avant et
 * après 70 ans, les exonérations, et chaque tranche du barème de l'usufruit.
 *
 * Ne jamais régénérer ce fichier de référence après une modification : ce serait
 * enregistrer la régression au lieu de la détecter.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { chargerSimulateur, chemin } = require('../helpers/simulateurs');
const { assertProche, assertTexteAffiche } = require('../helpers/assertions');

const instantane = JSON.parse(
  fs.readFileSync(chemin('tests', 'fixtures', 'instantanes-dmtg.json'), 'utf8'),
);

const { tolerance } = instantane;

/**
 * Recopie une valeur venue du contexte isolé d'un simulateur.
 *
 * Les tableaux produits dans ce contexte n'ont pas le même prototype que ceux
 * du test : une comparaison stricte échouerait alors que les valeurs sont
 * identiques.
 */
function recopier(valeur) {
  return JSON.parse(JSON.stringify(valeur));
}

function saisir(simulateur, champs) {
  for (const [id, valeur] of Object.entries(champs)) {
    const champ = simulateur.dom.document.getElementById(id);
    assert.ok(champ, `champ introuvable : ${id}`);
    champ.value = String(valeur);
  }
}

test('Succession — aucun montant ne bouge', async (t) => {
  for (const cas of instantane.succession) {
    await t.test(cas.nom, () => {
      const simulateur = chargerSimulateur('succession');
      saisir(simulateur, cas.champs);
      simulateur.dom.document.getElementById('av2Primes').value = String(cas.av2 || 0);

      const heritiers = simulateur.evaluer('heritiers');
      heritiers.length = 0;
      cas.heritiers.forEach((h, i) => heritiers.push({
        id: i + 1, nom: `H${i + 1}`, lien: h.lien, part: h.part, donations: h.donations,
      }));

      const av1 = simulateur.evaluer('av1List');
      av1.length = 0;
      (cas.av1 || []).forEach((a, i) => av1.push({ id: i + 1, nom: `A${i + 1}`, capital: a.capital }));

      const obtenu = simulateur.evaluer('getComputedTotals')();
      const attendu = cas.attendu;

      for (const clef of [
        'brut', 'passif', 'actifNet', 'actifNetTaxable', 'totalMontant', 'totalDroits',
        'av1TotCap', 'av1TotBase', 'av1TotPrel', 'av2primes', 'av2abat', 'av2taxable',
      ]) {
        assertProche(obtenu[clef], attendu[clef], tolerance, `${cas.nom} — ${clef}`);
      }
      assertProche(obtenu.exo.total, attendu.exoTotal, tolerance, `${cas.nom} — exonérations`);

      assert.equal(obtenu.heritiers.length, attendu.heritiers.length);
      obtenu.heritiers.forEach((h, i) => {
        for (const clef of ['montant', 'abat', 'base', 'droits']) {
          assertProche(h[clef], attendu.heritiers[i][clef], tolerance, `${cas.nom} — héritier ${i + 1} ${clef}`);
        }
      });
    });
  }
});

test('Démembrement — aucun montant affiché ne bouge', async (t) => {
  for (const cas of instantane.demembrement) {
    await t.test(cas.nom, () => {
      const simulateur = chargerSimulateur('demembrement');
      saisir(simulateur, cas.champs);
      simulateur.evaluer('recalculate')();

      for (const [id, attendu] of Object.entries(cas.attendu.affichage)) {
        const affiche = simulateur.dom.document.getElementById(id).textContent;
        assertTexteAffiche(affiche, attendu, `${cas.nom} — ${id}`);
      }

      // Les paramètres modifiables du barème doivent conserver exactement les
      // mêmes valeurs pré-remplies : c'est là que l'extraction pourrait
      // introduire un écart sans qu'aucun montant ne le montre immédiatement.
      const parametres = simulateur.evaluer('getParams')();
      assert.deepEqual(
        recopier([parametres.aba_directe, parametres.aba_frere, parametres.aba_neveu, parametres.aba_autre]),
        cas.attendu.parametres.abattements,
        `${cas.nom} — abattements pré-remplis`,
      );
      assert.deepEqual(
        recopier(parametres.tranches.map((t2) => [t2.low, t2.high === Infinity ? null : t2.high, t2.taux])),
        cas.attendu.parametres.tranches,
        `${cas.nom} — tranches pré-remplies`,
      );
    });
  }
});
