/**
 * Filet de non-régression du simulateur IFI et de la section IFI de l'IRPP (#15).
 *
 * Relevé **avant** l'extraction du référentiel IFI, par exécution réelle. Il
 * prouve qu'une refactorisation ne déplace aucun montant, au centime près.
 *
 * Il fige aussi la divergence de la fiche 2.4 : les deux pages calculent l'IFI
 * selon deux méthodes différentes, et le même patrimoine y donne deux impôts.
 * La figer est la seule façon de garantir qu'une extraction ne la modifie pas
 * au passage — la trancher appartient au référent fiscal.
 *
 * Ne jamais régénérer ce fichier de référence après une modification.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { chargerSimulateur, chemin } = require('../helpers/simulateurs');
const { assertProche } = require('../helpers/assertions');

const instantane = JSON.parse(
  fs.readFileSync(chemin('tests', 'fixtures', 'instantanes-ifi.json'), 'utf8'),
);
const { tolerance } = instantane;

const CHAMPS_IFI = [
  'dedTaxes', 'dedInterets', 'dedTravaux', 'dedAutres', 'fermage75Valeur',
  'fermage50Valeur', 'donsVerses', 'plafRevenus', 'plafIR', 'plafAutres',
];

const CHAMPS_IRPP_IFI = ['ifi_taxes', 'ifi_interets', 'ifi_depenses', 'ifi_dons_verses'];

const RESULTATS_IRPP_IFI = [
  'ifi_s_brut', 'ifi_s_deductions', 'ifi_s_net_avant', 'ifi_s_theorique',
  'ifi_s_net_apres', 'ifi_s_decote', 'ifi_s_red_dons', 'ifi_s_final',
  'ifi_res_final', 'ifi_res_net', 'ifi_tot_venale', 'ifi_tot_ifi',
  'ifi_tot_dette', 'ifi_tot_net',
  'ifi_t1', 'ifi_t2', 'ifi_t3', 'ifi_t4', 'ifi_t5', 'ifi_t6',
];

test('IFI — aucun montant ne bouge', async (t) => {
  for (const cas of instantane.ifi) {
    await t.test(cas.nom, () => {
      const simulateur = chargerSimulateur('ifi');
      let resultat = null;
      simulateur.contexte.renderResults = (r) => { resultat = r; };

      (cas.biens || []).forEach((bien) => simulateur.evaluer('addBien')(bien));
      for (const id of CHAMPS_IFI) {
        simulateur.dom.document.getElementById(id).value = String((cas.champs || {})[id] ?? '');
      }
      simulateur.evaluer('compute')();
      assert.ok(resultat, `${cas.nom} — le calcul n'a rien produit`);

      for (const [clef, attendu] of Object.entries(cas.attendu)) {
        if (clef === 'detailFinal') continue;
        assertProche(resultat[clef], attendu, tolerance, `${cas.nom} — ${clef}`);
      }

      // Le détail par tranche est comparé séparément : c'est lui qui révélerait
      // une borne déplacée, même quand le total reste juste par compensation.
      assert.equal(resultat.detailFinal.length, cas.attendu.detailFinal.length);
      cas.attendu.detailFinal.forEach((tranche, i) => {
        for (const clef of ['assiette', 'impot', 'taux']) {
          assertProche(
            resultat.detailFinal[i][clef], tranche[clef], tolerance,
            `${cas.nom} — tranche ${i + 1} ${clef}`,
          );
        }
      });
    });
  }
});

test("IRPP — la section IFI n'affiche aucun montant différent", async (t) => {
  for (const cas of instantane.irppIfi) {
    await t.test(cas.nom, () => {
      const simulateur = chargerSimulateur('irpp');
      const { document } = simulateur.dom;

      const biens = simulateur.evaluer('ifiBiens');
      biens.length = 0;
      (cas.biens || []).forEach((b, i) => biens.push({
        id: i + 1, label: `B${i}`, valeur: b.valeur, dette: b.dette || 0,
        rp: !!b.rp, societe: false,
      }));
      for (const id of CHAMPS_IRPP_IFI) {
        document.getElementById(id).value = String((cas.champs || {})[id] ?? '');
      }
      simulateur.evaluer('calcIFI')();

      for (const id of RESULTATS_IRPP_IFI) {
        assert.equal(document.getElementById(id).textContent, cas.attendu[id], `${cas.nom} — ${id}`);
      }
    });
  }
});

test("IFI — les deux simulateurs continuent de diverger, sans que l'extraction ne tranche", () => {
  // Fiche 2.4 : pour un patrimoine brut de 1 450 000 € grevé de 100 000 € de
  // passif, le simulateur IFI retranche l'IFI théorique de l'assiette et accorde
  // la décote ; la section IFI de l'IRPP fait ni l'un ni l'autre. L'écart est de
  // 668,39 €. Ce test existe pour que la divergence reste visible et qu'aucune
  // extraction ne la fasse disparaître par inadvertance.
  const casIfi = instantane.ifi.find((c) => c.nom.startsWith('décote — brut au-dessus'));
  const casIrpp = instantane.irppIfi.find((c) => c.nom.startsWith('décote — brut au-dessus'));

  assert.ok(casIfi && casIrpp, 'les deux scénarios de comparaison doivent exister');

  const cote = (texte) => Number(texte.replace(/[^0-9,]/g, '').replace(',', '.'));
  const ecart = cote(casIrpp.attendu.ifi_s_final) - casIfi.attendu.ifiFinal;

  assertProche(ecart, 668.39, 0.01, 'écart entre les deux méthodes de liquidation');
});

test("IFI — la conversion de devise n'a pas bougé avec l'étape 3 de #13", async (t) => {
  // Ces scénarios ont été relevés depuis le code d'AVANT cette étape, en
  // injectant directement des taux connus dans `fxRates` pour éviter tout aléa
  // réseau (voir tests/fixtures/instantanes-ifi.json, clé `scenariosDevise`).
  // Le test injecte les mêmes taux dans `tauxCache` après refactor : si le
  // calcul est inchangé, `patrimoineBrut` doit être identique au centime près.
  for (const cas of instantane.scenariosDevise.cas) {
    await t.test(cas.nom, () => {
      const simulateur = chargerSimulateur('ifi');
      let resultat = null;
      simulateur.contexte.renderResults = (r) => { resultat = r; };

      const tauxCache = simulateur.evaluer('tauxCache');
      for (const [devise, taux] of Object.entries(cas.taux)) {
        tauxCache[devise] = { taux, source: 'depot', date: '2026-08-27' };
      }

      cas.biens.forEach((bien) => simulateur.evaluer('addBien')(bien));
      simulateur.evaluer('compute')();

      assert.ok(resultat, `${cas.nom} — le calcul n'a rien produit`);
      assertProche(resultat.patrimoineBrut, cas.attendu.patrimoineBrut, tolerance, `${cas.nom} — patrimoineBrut`);
      assertProche(resultat.patrimoineNet, cas.attendu.patrimoineNet, tolerance, `${cas.nom} — patrimoineNet`);
    });
  }
});

test('IFI — un bien en devise sans taux résolu ne compte ni pour 0 ni pour sa valeur brute', () => {
  // Défaut trouvé en construisant l'étape 3 de #13 : computePatrimoineBrut
  // traitait un taux non résolu comme s'il valait 0 (silencieux) plutôt que de
  // signaler que le calcul n'est pas encore possible.
  const simulateur = chargerSimulateur('ifi');
  simulateur.evaluer('addBien')({
    localisation: 'Bien en attente de taux', type: 'Détenu en direct',
    rp: false, decote: false, valeur: 1000000, devise: 'USD', quotePart: 100,
  });

  // tauxCache reste vide : aucun taux n'a encore été résolu.
  const total = simulateur.evaluer('computePatrimoineBrut')();
  assert.equal(total, null, 'un bien en devise sans taux doit rendre le total indisponible, pas 0');
});
