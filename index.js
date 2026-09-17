require('dotenv').config();

// deploy: 2026-09-01

const TOKEN     = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID || '1483865462092726314';

if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN manquant !');
  process.exit(1);
}

const http  = require('http');
const https = require('https');
const { Client, GatewayIntentBits, MessageFlags } = require('discord.js');
const { registerCommands }                                                = require('./commands');
const { handleKhatmaCommand, handleKhatmaButton, handleKhatmaSelectMenu } = require('./handlers/khatma');

// ─── Client Discord ───────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

// ─── Routage des interactions ─────────────────────────────────────────────────

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = interaction.commandName;

      if (cmd === 'khatma') {
        await handleKhatmaCommand(interaction);
        return;
      }
    }

    if (interaction.isButton()) {
      const id = interaction.customId;
      if (id.startsWith('khatma_')) {
        await handleKhatmaButton(interaction);
        return;
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('khatma_')) {
      await handleKhatmaSelectMenu(interaction);
    }

  } catch (err) {
    console.error('❌ Erreur interaction :', err);
    try {
      const msg = { content: '❌ Une erreur est survenue. Réessaie dans quelques secondes.', flags: MessageFlags.Ephemeral };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(msg);
      } else {
        await interaction.reply(msg);
      }
    } catch (_) {}
  }
});

// ─── Démarrage ────────────────────────────────────────────────────────────────

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  await registerCommands(TOKEN, CLIENT_ID);
});

client.on('disconnect', () => console.warn('⚠️ Bot déconnecté de Discord.'));
client.on('error', err => console.error('❌ Erreur client Discord :', err));

process.on('unhandledRejection', err => console.error('❌ Unhandled rejection:', err));
process.on('uncaughtException',  err => console.error('❌ Uncaught exception:', err));

// ─── Serveur HTTP + self-ping (anti-sleep Render) ─────────────────────────────

const PORT     = process.env.PORT || 3000;
const SELF_URL = 'https://khatma-bot-u7dp.onrender.com/';

http.createServer((req, res) => {
  const status = client.isReady() ? 'connected' : 'disconnected';
  const uptime = Math.floor(process.uptime());
  const ws     = client.ws?.status ?? 'unknown';
  res.writeHead(200);
  res.end(`v6 discord=${status} ws=${ws} uptime=${uptime}s guilds=${client.guilds.cache.size}`);
}).listen(PORT, () => {
  console.log(`🌐 Serveur HTTP sur le port ${PORT}`);
  setInterval(() => {
    https.get(SELF_URL, () => {}).on('error', e => console.warn('⚠️ Self-ping échoué :', e.message));
  }, 10 * 60 * 1000);
});

// ─── Connexion Discord ────────────────────────────────────────────────────────

client.login(TOKEN).catch(err => {
  console.error('❌ Échec connexion Discord:', err.message);
  process.exit(1);
});
