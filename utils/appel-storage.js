/**
 * utils/appel-storage.js — Persistance de l'appel quotidien
 *
 * Structure :
 * {
 *   "2026-08-16": {
 *     "messageId": "...",
 *     "channelId": "...",
 *     "sentAt": "16:00",
 *     "presentes": {
 *       "userId": { "displayName": "lemelimelo", "at": "16:03" }
 *     }
 *   }
 * }
 */

const fs = require('fs');

const DATA_DIR  = fs.existsSync('/data') ? '/data' : '/app';
const DATA_FILE = `${DATA_DIR}/appels.json`;

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('⚠️  Lecture appels :', err.message);
  }
  return {};
}

function save(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('⚠️  Écriture appels :', err.message);
  }
}

function todayKey() {
  return new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })
    .split('/').reverse().join('-'); // YYYY-MM-DD
}

function createAppel(messageId, channelId) {
  const data = load();
  const key  = todayKey();
  data[key]  = {
    messageId,
    channelId,
    sentAt:    new Date().toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }),
    presentes: {},
  };
  save(data);
  return key;
}

function recordPresence(userId, displayName) {
  const data = load();
  const key  = todayKey();
  if (!data[key]) return false;
  if (data[key].presentes[userId]) return false; // already recorded
  data[key].presentes[userId] = {
    displayName,
    at: new Date().toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }),
  };
  save(data);
  return true;
}

function getTodayAppel() {
  const data = load();
  return data[todayKey()] ?? null;
}

function getAppelByDate(dateKey) {
  const data = load();
  return data[dateKey] ?? null;
}

function getAllKeys() {
  return Object.keys(load()).sort().reverse();
}

module.exports = { createAppel, recordPresence, getTodayAppel, getAppelByDate, getAllKeys, todayKey };
