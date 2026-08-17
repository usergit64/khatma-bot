/**
 * index.js — Point d'entrée du bot Discord
 *
 * Ce fichier initialise le client Discord, enregistre les commandes slash
 * et route chaque interaction vers le bon handler.
 *
 * ► Pour MODIFIER les questions du QCM  → lecons.js
 * ► Pour AJOUTER une commande slash     → commands.js + ajouter un handler ici
 * ► Pour MODIFIER la logique Khatma     → handlers/khatma.js
 * ► Pour MODIFIER la logique QCM        → handlers/qcm.js
 * ► Pour MODIFIER la persistance        → utils/storage.js
 *
 * Variables d'environnement requises (.env) :
 *   DISCORD_TOKEN  — Token du bot (Discord Developer Portal → Bot)
 *   CLIENT_ID      — Application ID (Discord Developer Portal → General Information)
 */

require('dotenv').config();

const http = require('http');
const { Client, GatewayIntentBits, MessageFlags } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { sendAppel, handleAppelButton, handleAppelCommand, startScheduler } = require('./handlers/appel');

const { registerCommands }                          = require('./commands');
const { handleQcmCommand, handleQcmStart, handleQcmAnswer } = require('./handlers/qcm');
const { handleKhatmaCommand, handleKhatmaButton, handleKhatmaSelectMenu } = require('./handlers/khatma');
const { readAll, clearAll }                         = require('./utils/storage');
const { LECON_CHOICES }                             = require('./lecons');

const TOKEN     = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ─── Client Discord ───────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, // requis pour résoudre les membres par nom
  ],
});

// ── Helpers commandes professeure ─────────────────────────────────────────────

function isProfesseure(interaction) {
  return interaction.member?.roles.cache.some(r => r.name === 'professeure-tome1') ?? false;
}

async function rejectNotProfesseure(interaction) {
  await interaction.reply({
    content: '❌ Cette commande est réservée aux membres avec le rôle **professeure-tome1**.',
    flags:   MessageFlags.Ephemeral,
  });
}

function scoreEmoji(pct) {
  if (pct === 100) return '🏆';
  if (pct >= 85)   return '🌟';
  if (pct >= 60)   return '📚';
  return '💪';
}

// ─── Routage des interactions ─────────────────────────────────────────────────

client.on('interactionCreate', async interaction => {
  const userId   = interaction.user.id;
  const username = interaction.member?.displayName ?? interaction.user.username;

  // ── Commandes slash ──────────────────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const cmd = interaction.commandName;

    if (cmd === 'khatma') {
      await handleKhatmaCommand(interaction);
      return;
    }

    if (cmd === 'qcm') {
      await handleQcmCommand(interaction);
      return;
    }

    // ── /resultats (prof) ──
    if (cmd === 'resultats') {
      if (!isProfesseure(interaction)) { await rejectNotProfesseure(interaction); return; }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const data  = readAll(interaction.options.getString('lecon') ?? '');
      const lines = Object.values(data).flatMap(info => {
        if (!info.sessions.length) return [];
        const derniere = info.sessions.at(-1);
        const moy = Math.round(info.sessions.reduce((a, s) => a + s.pct, 0) / info.sessions.length);
        return [`${scoreEmoji(derniere.pct)} **${info.username}** — Dernière : ${derniere.score}/${derniere.total} (${derniere.pct}%) | Moy : ${moy}% | Essais : ${info.sessions.length}`];
      });
      if (!lines.length) { await interaction.editReply('Aucun résultat enregistré.'); return; }
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('📊  Récapitulatif')
            .setDescription(lines.join('\n'))
            .setColor(0x1C2833)
            .setTimestamp()
            .setFooter({ text: `${lines.length} élève(s) enregistrée(s)` })
        ],
      });
      return;
    }

    // ── /detail @eleve (prof) ──
    if (cmd === 'detail') {
      if (!isProfesseure(interaction)) { await rejectNotProfesseure(interaction); return; }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const membre = interaction.options.getUser('eleve');
      const data   = readAll(interaction.options.getString('lecon') ?? '');
      const info   = data[membre.id];
      if (!info) { await interaction.editReply(`Aucun résultat pour **${membre.username}**.`); return; }
      const embed = new EmbedBuilder().setTitle(`🔍  Détail — ${info.username}`).setColor(0xE67E22);
      for (const s of info.sessions.slice(-3)) {
        const errs = s.erreurs.length
          ? s.erreurs.map(e => `• ${e.reponseDonnee} ✗ → ${e.bonneReponse}`).join('\n')
          : '✅ Aucune erreur !';
        embed.addFields({ name: `${s.date} — ${s.lecon} — ${s.score}/${s.total} (${s.pct}%)`, value: errs, inline: false });
      }
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // ── /reinitialiser_qcm (prof) ──
    if (cmd === 'reinitialiser_qcm') {
      if (!isProfesseure(interaction)) { await rejectNotProfesseure(interaction); return; }
      clearAll();
      await interaction.reply({ content: '🗑️ Tous les résultats ont été effacés.', flags: MessageFlags.Ephemeral });
      return;
    }

    if (cmd === 'appel') {
      const sub = interaction.options.getSubcommand(false);
      if ((sub === 'now' || sub === 'test') && !isProfesseure(interaction)) { await rejectNotProfesseure(interaction); return; }
      await handleAppelCommand(interaction);
      return;
    }
  }

  // ── Boutons ──────────────────────────────────────────────────────────────────
  if (interaction.isButton()) {
    const id = interaction.customId;

    if (id.startsWith('khatma_')) {
      await handleKhatmaButton(interaction);
      return;
    }

    if (id.startsWith('qcm_start_')) {
      const leconId = id.replace('qcm_start_', '');
      await handleQcmStart(interaction, leconId);
      return;
    }

    if (id.startsWith('qcm_answer_')) {
      const choiceIndex = parseInt(id.replace('qcm_answer_', ''), 10);
      await handleQcmAnswer(interaction, choiceIndex);
      return;
    }

    if (id === 'appel_presente') {
      await handleAppelButton(interaction);
      return;
    }
  }

  // ── Menus déroulants ─────────────────────────────────────────────────────────
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith('khatma_')) {
      await handleKhatmaSelectMenu(interaction);
    }
  }
});

// ─── Démarrage ────────────────────────────────────────────────────────────────

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  await registerCommands(TOKEN, CLIENT_ID);
  startScheduler(client);
  console.log('⏰ Planificateur appel 16h00 (Paris) démarré.');
});

// Serveur HTTP minimal pour Render / UptimeRobot
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
}).listen(PORT, () => console.log(`🌐 Serveur HTTP sur le port ${PORT}`));

client.login(TOKEN);
