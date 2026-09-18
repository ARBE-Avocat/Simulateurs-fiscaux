/**
 * Table des anciennes adresses des simulateurs (issue #20, §4.2 de
 * `docs/ARCHITECTURE_CIBLE.md`).
 *
 * Jusqu'au jalon `0.5`, chaque simulateur était un fichier à la racine, nommé
 * avec des espaces, des accents et un millésime. Ces adresses ont pu être
 * partagées ou mises en favori : **une adresse publiée une fois n'est jamais
 * rendue morte.** Le build produit, pour chacune, une page minimale qui renvoie
 * vers l'adresse stable.
 *
 * Cette table ne fait que grandir. Retirer une ligne casserait un lien que
 * quelqu'un a peut-être conservé.
 */

'use strict';

/** Ancien nom de fichier → adresse stable, relative à la racine du site. */
const ANCIENNES_ADRESSES = Object.freeze({
  'Simulation IRPP - Avril 2026.html': 'simulateurs/irpp/',
  'Simulateur_IR 2025 et CEHR_CDHR 2026.html': 'simulateurs/ir-cehr-cdhr/',
  'Simulateur_PV_Immobilière Juillet 2026.html': 'simulateurs/plus-value-immobiliere/',
  'Simulation IFI - Avril 2026.html': 'simulateurs/ifi/',
  'Simulation Succession.html': 'simulateurs/succession/',
  'Simulation démembrement immo - Juin 2026.html': 'simulateurs/demembrement/',
});

/** Échappe le strict nécessaire pour insérer une chaîne dans du HTML. */
function echapperHtml(texte) {
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Page de redirection vers `cible`, relative à la page elle-même.
 *
 * GitHub Pages ne permet pas de redirection HTTP : la page porte donc un
 * `<meta http-equiv="refresh">` immédiat, un lien `canonical` pour les
 * moteurs de recherche, et un lien cliquable si le navigateur n'a pas suivi.
 */
function pageDeRedirection(cible) {
  const href = echapperHtml(cible);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0; url=${href}">
<link rel="canonical" href="${href}">
<title>Ce simulateur a changé d'adresse</title>
<style>body{font-family:system-ui,sans-serif;max-width:40em;margin:4em auto;padding:0 1em;color:#1a1f1a}</style>
</head>
<body>
<p>Ce simulateur a changé d'adresse. Si vous n'êtes pas redirigé automatiquement,
<a href="${href}">cliquez ici</a> et pensez à mettre à jour votre favori.</p>
</body>
</html>
`;
}

module.exports = { ANCIENNES_ADRESSES, echapperHtml, pageDeRedirection };
