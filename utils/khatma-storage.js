const fs   = require('fs');
const path = require('path');

const DATA_DIR  = fs.existsSync('/data') ? '/data'
                : fs.existsSync('/app')  ? '/app'
                : path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'khatma.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DEFAULT = () => ({
  participants:   [],
  listeners:      [],
  messageId:      null,
  channelId:      null,
  listeMessageId: null,
  listeChannelId: null,
});

function load(guildId) {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const all = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return all[guildId] ?? DEFAULT();
    }
  } catch (err) {
    console.error('⚠️ Lecture khatma :', err.message);
  }
  return DEFAULT();
}

function save(guildId, khatma) {
  try {
    let all = {};
    if (fs.existsSync(DATA_FILE)) {
      try { all = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (_) {}
    }
    all[guildId] = khatma;
    fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), 'utf8');
  } catch (err) {
    console.error('⚠️ Écriture khatma :', err.message);
  }
}

function reset(guildId) {
  save(guildId, DEFAULT());
  return DEFAULT();
}

module.exports = { load, save, reset, DEFAULT };
