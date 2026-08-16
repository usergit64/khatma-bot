/**
 * handlers/appel.js — Appel quotidien Cours Tome 1
 *
 * - sendAppel(client)        : envoie le message d'appel dans "cours tome 1"
 * - handleAppelButton()      : enregistre la présence quand une élève clique ✅
 * - handleAppelCommand()     : commande /appel pour voir le résultat du jour
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { createAppel, recordPresence, getTodayAppel, getAppelByDate, getAllKeys } = require('../utils/appel-storage');

// ── Liste de test ─────────────────────────────────────────────────────────────

const ELEVES_TEST = ['oum khalil'];

// ── Liste des élèves (display names / usernames Discord) ──────────────────────

const ELEVES = [
  'lemelimelo',
  'jazariyaa',
  'Fahima0469',
  'Binetou Al Raida',
  'axllhai.2',
  'Mymyb',
  'Umm Sulayman',
  'Habiba',
  'Moukarama_P',
  'Serenitain',
  'soso',
  'Iliana',
  're0yna',
  'Kodku',
  'Imane_',
  'Sase',
  'smnyaa',
];

const CHANNEL_NAME = 'cours-tome-1'; // slug Discord (tirets, minuscules)

// ── Résolution des membres par display name ───────────────────────────────────

async function resolveMembers(guild, list = ELEVES) {
  await guild.members.fetch(); // nécessite GuildMembers intent
  const found   = [];
  const missing = [];

  for (const name of list) {
    const lc = name.toLowerCase();
    const member = guild.members.cache.find(m =>
      m.displayName.toLowerCase() === lc ||
      m.user.username.toLowerCase() === lc ||
      m.user.globalName?.toLowerCase() === lc
    );
    if (member) found.push({ name, member });
    else        missing.push(name);
  }

  return { found, missing };
}

// ── Construction de l'embed d'appel ──────────────────────────────────────────

function buildAppelEmbed(presentes, total) {
  const count   = Object.keys(presentes).length;
  const names   = Object.values(presentes)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map(p => `✅ ${p.displayName} *(${p.at})*`)
    .join('\n') || '—';

  return new EmbedBuilder()
    .setTitle('📋  Appel — Cours Tome 1')
    .setColor(0x7C3AED)
    .addFields(
      { name: `Présentes (${count}/${total})`, value: names, inline: false },
    )
    .setFooter({ text: 'Cliquez sur le bouton ci-dessous pour confirmer votre présence' })
    .setTimestamp();
}

// ── Bouton présence ───────────────────────────────────────────────────────────

function buildPresenceRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('appel_presente')
      .setLabel('Présente ✅')
      .setStyle(ButtonStyle.Success)
  );
}

// ── Envoi de l'appel (générique) ──────────────────────────────────────────────

async function sendAppelToChannel(guild, channel, elevesList) {
  const { found, missing } = await resolveMembers(guild, elevesList);

  const mentions   = found.map(({ member }) => `<@${member.id}>`).join(' ');
  const missingTxt = missing.length ? `\n⚠️ Non trouvées : ${missing.join(', ')}` : '';

  const embed = buildAppelEmbed({}, elevesList.length);
  const row   = buildPresenceRow();

  const msg = await channel.send({
    content: `${mentions}${missingTxt}`,
    embeds:  [embed],
    components: [row],
  });

  createAppel(msg.id, channel.id);
  console.log(`✅ Appel envoyé dans #${channel.name} (${new Date().toLocaleString('fr-FR')})`);
  return msg;
}

async function sendAppel(client) {
  const guild = client.guilds.cache.first();
  if (!guild) { console.error('❌ Appel : aucun serveur trouvé'); return; }

  const channel = guild.channels.cache.find(
    c => c.name === CHANNEL_NAME || c.name === CHANNEL_NAME.replace(/-/g, ' ')
  );
  if (!channel) { console.error(`❌ Appel : salon "${CHANNEL_NAME}" introuvable`); return; }

  await sendAppelToChannel(guild, channel, ELEVES);
}

// ── Gestion du bouton ─────────────────────────────────────────────────────────

async function handleAppelButton(interaction) {
  const displayName = interaction.member?.displayName ?? interaction.user.username;
  const userId      = interaction.user.id;

  const isNew = recordPresence(userId, displayName);

  if (!isNew) {
    await interaction.reply({
      content: '✅ Ta présence est déjà enregistrée !',
      flags:   MessageFlags.Ephemeral,
    });
    return;
  }

  // Mettre à jour l'embed
  const appel    = getTodayAppel();
  const embed    = buildAppelEmbed(appel.presentes, ELEVES.length);

  await interaction.update({ embeds: [embed], components: [buildPresenceRow()] });
}

// ── Commande /appel ───────────────────────────────────────────────────────────

async function handleAppelCommand(interaction) {
  const sub = interaction.options.getSubcommand(false);

  // /appel now → force envoi immédiat (prof seulement)
  if (sub === 'now') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await sendAppel(interaction.client);
    await interaction.editReply('✅ Appel envoyé manuellement.');
    return;
  }

  // /appel test → envoi dans le salon courant avec liste de test
  if (sub === 'test') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const guild    = interaction.guild;
    const channel  = interaction.channel;
    // liste test = ELEVES_TEST + la personne qui lance la commande
    const invokerName = interaction.member?.displayName ?? interaction.user.username;
    const testList = [...new Set([invokerName, ...ELEVES_TEST])];
    await sendAppelToChannel(guild, channel, testList);
    await interaction.editReply(`✅ Test envoyé dans <#${channel.id}> avec : ${testList.join(', ')}`);
    return;
  }

  // /appel resultats [date] → voir l'appel
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const dateOpt = interaction.options.getString('date');
  let appel;

  if (dateOpt) {
    // format attendu : YYYY-MM-DD
    appel = getAppelByDate(dateOpt);
    if (!appel) { await interaction.editReply(`❌ Aucun appel trouvé pour le ${dateOpt}.`); return; }
  } else {
    appel = getTodayAppel();
    if (!appel) { await interaction.editReply("❌ Aucun appel envoyé aujourd'hui."); return; }
  }

  const count     = Object.values(appel.presentes).length;
  const presentes = Object.values(appel.presentes)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map(p => `✅ **${p.displayName}** *(${p.at})*`)
    .join('\n') || '—';

  const absentes = ELEVES.filter(
    name => !Object.values(appel.presentes).some(
      p => p.displayName.toLowerCase() === name.toLowerCase()
    )
  ).map(n => `❌ ${n}`).join('\n') || '—';

  const embed = new EmbedBuilder()
    .setTitle(`📋 Appel du ${dateOpt ?? new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}`)
    .setColor(0x7C3AED)
    .addFields(
      { name: `Présentes (${count}/${ELEVES.length})`, value: presentes, inline: true },
      { name: `Absentes (${ELEVES.length - count}/${ELEVES.length})`, value: absentes, inline: true },
    )
    .setFooter({ text: `Envoyé à ${appel.sentAt}` });

  await interaction.editReply({ embeds: [embed] });
}

// ── Planificateur 16h (Paris) ─────────────────────────────────────────────────

function startScheduler(client) {
  let lastSentDate = '';

  setInterval(async () => {
    const now = new Date().toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      hour:     '2-digit',
      minute:   '2-digit',
      day:      '2-digit',
      month:    '2-digit',
      year:     'numeric',
    });
    // "DD/MM/YYYY, HH:MM"
    const [datePart, timePart] = now.split(', ');
    const time = timePart?.trim();
    const date = datePart?.trim();

    if (time === '16:00' && date !== lastSentDate) {
      lastSentDate = date;
      await sendAppel(client);
    }
  }, 60_000); // vérification chaque minute
}

module.exports = { sendAppel, handleAppelButton, handleAppelCommand, startScheduler };
