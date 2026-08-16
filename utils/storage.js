/**
 * utils/storage.js — Persistance des résultats QCM
 *
 * Les résultats sont stockés dans un fichier JSON local.
 *
 * ► Railway : monter un volume sur /data pour conserver les données entre déploiements
 *     → Settings → Volumes → Mount Path : /data
 *   Sans volume, les données sont perdues à chaque redéploiement.
 *
 * Structure du fichier :
 *   {
 *     "userId": {
 *       "username": "Prénom",
 *       "sessions": [{ lecon, date, score, total, pct, erreurs }]
 *     }
 *   }
 */

const fs = require('fs');

const DATA_DIR  = fs.existsSync('/data') ? '/data' : '/app';
const DATA_FILE = `${DATA_DIR}/resultats_qcm.json`;

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('⚠️  Lecture résultats :', err.message);
  }
  return {};
}

function save(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('⚠️  Écriture résultats :', err.message);
  }
}

function appendResult(userId, username, leconId, score, total, erreurs) {
  const data = load();
  if (!data[userId]) data[userId] = { username, sessions: [] };
  data[userId].username = username;
  data[userId].sessions.push({
    lecon:   leconId,
    date:    new Date().toLocaleString('fr-FR'),
    score, total,
    pct:     Math.round(score / total * 100),
    erreurs,
  });
  save(data);
}

function readAll(leconFilter = '') {
  const data   = load();
  const result = {};
  for (const [uid, info] of Object.entries(data)) {
    const sessions = leconFilter
      ? info.sessions.filter(s => s.lecon === leconFilter)
      : info.sessions;
    if (sessions.length) result[uid] = { username: info.username, sessions };
  }
  return result;
}

function clearAll() {
  save({});
}

module.exports = { appendResult, readAll, clearAll };
