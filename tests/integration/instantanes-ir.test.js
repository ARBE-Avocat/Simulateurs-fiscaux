/**
 * Filet de non-régression des simulateurs « IR, CEHR et CDHR » et IRPP (#14).
 *
 * Relevé **avant** l'extraction des référentiels de l'impôt sur le revenu, par
 * exécution réelle des deux simulateurs. Il prouve qu'une refactorisation ne
 * déplace aucun montant, au centime près.
 *
 * Il fige aussi, volontairement, des comportements réputés fautifs mais non
 * corrigés : la décote CDHR de l'issue #4 et l'absence de plafonnement du
 * quotient familial dans l'IRPP, fiche 2.3. Les figer est la seule façon de
 * garantir qu'une extraction ne les modifie pas au passage — leur correction
 * relève d'une décision du référent fiscal, pas d'un déplacement de données.
 *
 * Ne jamais régénérer ce fichier de référence après une modification.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { chargerSimulateur, chemin } = require('../helpers/simulateurs');
const { assertProche } = require('../helpers/assertions');

const instantane = JSON.parse(
  fs.readFileSync(chemin('tests', 'fixtures', 'instantanes-ir.json'), 'utf8'),
);
const { tolerance } = instantane;

/**
 * Cases à cocher renseignées avant chaque calcul de l'IRPP.
 *
 * Le faux DOM les crée décochées, alors qu'elles commandent l'application des
 * prélèvements sociaux et la prise en compte du second déclarant. Sans ce
 * réglage, les scénarios n'exerceraient jamais le taux de 17,2 %, qui est
 * précisément ce que l'extraction déplace.
 */
const CASES_IRPP = [
  'has_d2', 'psx_sal', 'psx_bspce', 'psx_pen', 'psx_pen_etr', 'psx_fon', 'psx_bnc',
  'psx_bic', 'psx_autre_rev', 'psx_div', 'psx_int', 'psx_autre', 'psx_microfon',
  'psx_loc', 'psx_microbnc', 'psx_microbic_vente', 'psx_microbic_serv',
];

/** Paramètres pré-remplis du simulateur IRPP, que le faux DOM n'applique pas. */
const PARAMETRES_IRPP = {
  t1_de: 0, t1_a: 11600, t2_a: 29579, t2_tx: 11, t3_a: 84577, t3_tx: 30,
  t4_a: 181917, t4_tx: 41, t5_tx: 45, aba_sal: 14555, aba_pen: 4439,
  dec_cel_seuil: 1965, dec_cel_mt: 889, dec_cou_seuil: 3249, dec_cou_mt: 1470,
  cdhr_aba_ic: 12500, cdhr_aba_pac: 1500, csg_ded: 6.8,
};

const RESULTATS_IRPP = [
  'res_rfr', 'res_quotient', 's_impot_foyer', 's_decote', 's_red_dons', 's_impot_net',
  's_ir_pfu', 's_ps_pen', 's_ps_fon', 's_ps_pfu', 's_ps_pv', 's_cehr', 's_cdhr',
  's_final', 'res_final', 's_csg_ded', 's_ps_etr',
];

test('IR, CEHR et CDHR — aucun montant ne bouge', async (t) => {
  for (const cas of instantane.irCehrCdhr) {
    await t.test(cas.nom, () => {
      const simulateur = chargerSimulateur('ir-cehr-cdhr');
      let capture = null;
      simulateur.contexte.render = (r) => { capture = r; };

      for (const [id, valeur] of Object.entries(cas.champs)) {
        simulateur.dom.document.getElementById(id).value = String(valeur);
      }
      simulateur.evaluer('compute')();
      assert.ok(capture, `${cas.nom} — le calcul n'a rien produit`);

      const attendu = cas.attendu;
      for (const clef of ['ps', 'cehrLissee', 'cehrNonLissee', 'rfrPlein', 'credit', 'majoration']) {
        assertProche(capture[clef], attendu[clef], tolerance, `${cas.nom} — ${clef}`);
      }
      assert.equal(capture.eligibleLissage, attendu.eligibleLissage, `${cas.nom} — lissage`);

      attendu.totals.forEach((valeur, i) => {
        assertProche(capture.totals[i], valeur, tolerance, `${cas.nom} — total hypothèse ${i + 1}`);
      });
      attendu.rates.forEach((valeur, i) => {
        assertProche(capture.rates[i], valeur, tolerance, `${cas.nom} — taux hypothèse ${i + 1}`);
      });
      ['hyp1', 'hyp2', 'hyp3'].forEach((clef) => {
        assertProche(capture[clef].irNet, attendu[clef].irNet, tolerance, `${cas.nom} — ${clef} IR net`);
        assertProche(
          capture[clef].cdhrRetenue, attendu[clef].cdhrRetenue, tolerance,
          `${cas.nom} — ${clef} CDHR retenue`,
        );
      });
    });
  }
});

test('IRPP — aucun montant affiché ne bouge', async (t) => {
  for (const cas of instantane.irpp) {
    await t.test(cas.nom, () => {
      const simulateur = chargerSimulateur('irpp');
      const { document } = simulateur.dom;

      for (const id of CASES_IRPP) document.getElementById(id).checked = true;
      for (const [id, valeur] of Object.entries({ ...PARAMETRES_IRPP, ...cas.champs })) {
        document.getElementById(id).value = String(valeur);
      }

      if (cas.pv && cas.pv.length) {
        const lignes = simulateur.evaluer('pvRows');
        lignes.length = 0;
        cas.pv.forEach((r, i) => lignes.push({
          id: i, devise: 'EUR', label: `L${i}`, da: r.da, pu_a: r.pu_a, qte: r.qte,
          fr_a: 0, fx_a: 1, dc: r.dc, pu_c: r.pu_c, fr_c: 0, fx_c: 1,
          renf: !!r.renf, psx: true,
        }));
      }

      simulateur.evaluer('calc')();

      for (const id of RESULTATS_IRPP) {
        assert.equal(
          document.getElementById(id).textContent,
          cas.attendu[id],
          `${cas.nom} — ${id}`,
        );
      }
    });
  }
});
