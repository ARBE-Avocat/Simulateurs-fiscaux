#!/usr/bin/env node
/**
 * Serveur HTTP local minimal, sans dépendance, pour consulter les simulateurs
 * pendant le développement (`npm run dev`).
 *
 * Il sert la racine du dépôt telle quelle : l'arborescence du dépôt étant celle
 * du site publié, ce que l'on voit ici est ce qui sera publié. Un dossier est
 * servi par son `index.html`, comme le fait GitHub Pages, ce qui permet de
 * vérifier les adresses stables en `simulateurs/<slug>/`.
 *
 * Il remplace `python3 -m http.server`, qui suppose Python installé — ce n'est
 * pas le cas de tous les postes — alors que Node.js l'est déjà pour les tests.
 *
 * Usage : node scripts/servir.js [--port 8000] [--dossier site]
 */

'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const RACINE = path.resolve(__dirname, '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8',
};

function option(nom, defaut) {
  const index = process.argv.indexOf(`--${nom}`);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : defaut;
}

const port = Number(option('port', '8000'));
const dossier = path.resolve(RACINE, option('dossier', '.'));

const serveur = http.createServer((requete, reponse) => {
  let chemin;
  try {
    chemin = decodeURIComponent(new URL(requete.url, 'http://localhost').pathname);
  } catch (erreur) {
    reponse.writeHead(400).end('Requête invalide');
    return;
  }

  // Le chemin est confiné au dossier servi : `..` ne remonte jamais au-dessus.
  let fichier = path.join(dossier, path.normalize(chemin));
  if (!fichier.startsWith(dossier)) {
    reponse.writeHead(403).end('Interdit');
    return;
  }

  if (fs.existsSync(fichier) && fs.statSync(fichier).isDirectory()) {
    if (!chemin.endsWith('/')) {
      reponse.writeHead(301, { Location: `${chemin}/` }).end();
      return;
    }
    fichier = path.join(fichier, 'index.html');
  }

  if (!fs.existsSync(fichier) || !fs.statSync(fichier).isFile()) {
    reponse.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end(`Introuvable : ${chemin}`);
    return;
  }

  reponse.writeHead(200, {
    'Content-Type': TYPES[path.extname(fichier).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(fichier).pipe(reponse);
});

serveur.listen(port, () => {
  console.log(`Simulateurs servis depuis ${path.relative(RACINE, dossier) || 'la racine du dépôt'} : http://localhost:${port}/`);
  console.log('Ctrl+C pour arrêter.');
});
