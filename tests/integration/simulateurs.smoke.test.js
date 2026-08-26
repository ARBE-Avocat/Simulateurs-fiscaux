/**
 * Tests de fumée : chaque simulateur doit se charger et exécuter son script
 * sans erreur, et rester relié à la page d'accueil.
 *
 * Ces tests ne vérifient aucun résultat fiscal. Ils détectent les pannes
 * grossières : script cassé, fichier renommé, lien de retour supprimé.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { trouverMelangesAlphabets } = require('../helpers/confusables');
const {
  SIMULATEURS,
  chemin,
  chargerSimulateur,
  extraireScripts,
  lireHtml,
  verifierSyntaxe,
} = require('../helpers/simulateurs');

for (const { cle, fichier } of SIMULATEURS) {
  test(`simulateur ${cle} — le fichier HTML est présent`, () => {
    assert.ok(fs.existsSync(chemin(fichier)), `fichier introuvable : ${fichier}`);
  });

  test(`simulateur ${cle} — la page a un titre et un lien vers l'accueil`, () => {
    const html = lireHtml(cle);
    assert.match(html, /<title>[^<]+<\/title>/, 'la page doit avoir un <title> non vide');
    assert.match(html, /href="index\.html"/, 'la page doit garder un lien relatif vers index.html');
  });

  test(`simulateur ${cle} — le script embarqué est syntaxiquement valide`, () => {
    const scripts = extraireScripts(lireHtml(cle));
    assert.ok(scripts.length > 0, 'aucun script embarqué trouvé');
    scripts.forEach((source, index) => {
      verifierSyntaxe(source, `${fichier}#script-${index + 1}`);
    });
  });

  test(`simulateur ${cle} — le script s'exécute sans erreur hors navigateur`, () => {
    assert.doesNotThrow(() => chargerSimulateur(cle));
  });

  test(`simulateur ${cle} — aucun nom ne mélange alphabet latin et non latin`, () => {
    const trouvailles = extraireScripts(lireHtml(cle)).flatMap((source) =>
      trouverMelangesAlphabets(source)
    );
    const details = trouvailles
      .map((t) => `ligne ${t.ligne} du script : ...${t.extrait}...`)
      .join('\n');
    assert.equal(
      trouvailles.length,
      0,
      `caractère non latin détecté au milieu d'un nom, ce qui crée deux noms visuellement identiques :\n${details}`
    );
  });
}

test("index.html — les liens vers les simulateurs pointent vers des fichiers existants", () => {
  const accueil = fs.readFileSync(chemin('index.html'), 'utf8');
  const liens = [...accueil.matchAll(/href="([^"]+)"/g)]
    .map((correspondance) => correspondance[1])
    .filter((lien) => !/^(https?:|mailto:|#)/i.test(lien))
    .map((lien) => decodeURIComponent(lien));

  assert.ok(liens.length > 0, "aucun lien relatif trouvé dans index.html");
  for (const lien of liens) {
    assert.ok(fs.existsSync(chemin(lien)), `lien cassé depuis index.html : ${lien}`);
  }
});

test("index.html — chaque simulateur listé est accessible depuis l'accueil", () => {
  const accueil = fs.readFileSync(chemin('index.html'), 'utf8');
  const liens = [...accueil.matchAll(/href="([^"]+)"/g)].map((c) => decodeURIComponent(c[1]));
  for (const { cle, fichier } of SIMULATEURS) {
    assert.ok(liens.includes(fichier), `${cle} n'est pas lié depuis index.html`);
  }
});
