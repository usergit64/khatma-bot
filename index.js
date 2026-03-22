require('dotenv').config();
const {
  Client, GatewayIntentBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, EmbedBuilder,
  MessageFlags, REST, Routes, SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');

const TOKEN     = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ─── Client Discord ────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ══════════════════════════════════════════════════════════════════════════════
//  STOCKAGE JSON (fichier local)
//
//  Par défaut les résultats sont dans /app/resultats_qcm.json
//
//  Pour garder les données ENTRE les déploiements :
//    → Railway : Settings → Volumes → Mount Path : /data
//    → Le bot détecte /data automatiquement et l'utilise
// ══════════════════════════════════════════════════════════════════════════════

const DATA_DIR  = fs.existsSync('/data') ? '/data' : '/app';
const DATA_FILE = `${DATA_DIR}/resultats_qcm.json`;

function loadResults() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) { console.error('⚠️  Lecture résultats :', err.message); }
  return {};
}

function saveResults(data) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }
  catch (err) { console.error('⚠️  Écriture résultats :', err.message); }
}

async function appendResult(userId, username, leconId, score, total, erreurs) {
  const data = loadResults();
  if (!data[userId]) data[userId] = { username, sessions: [] };
  data[userId].username = username;
  data[userId].sessions.push({
    lecon: leconId,
    date:  new Date().toLocaleString('fr-FR'),
    score, total, pct: Math.round(score / total * 100), erreurs,
  });
  saveResults(data);
}

async function readAllResults(leconFilter = '') {
  const data   = loadResults();
  const result = {};
  for (const [uid, info] of Object.entries(data)) {
    const sessions = leconFilter ? info.sessions.filter(s => s.lecon === leconFilter) : info.sessions;
    if (sessions.length) result[uid] = { username: info.username, sessions };
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
//  QCM — LEÇONS
//
//  ╔═══════════════════════════════════════════════════════════════════════╗
//  ║  COMMENT AJOUTER UNE NOUVELLE LEÇON (3 étapes)                      ║
//  ║                                                                       ║
//  ║  1. AJOUTER le bloc ici dans LECONS :                                ║
//  ║       lecon2: {                                                       ║
//  ║         titre: 'Leçon 2 — ...',                                      ║
//  ║         questions: [                                                  ║
//  ║           {                                                           ║
//  ║             enonce:      'Question (**mot** en gras) ?',             ║
//  ║             options:     [['الخيار أ'], ['الخيار ب'], ['الخيار ج']], ║
//  ║             reponse:     0,   ← 0=A  1=B  2=C                       ║
//  ║             explication: 'Explication courte ✅',                    ║
//  ║           },                                                          ║
//  ║         ],                                                            ║
//  ║       },                                                              ║
//  ║                                                                       ║
//  ║  2. AJOUTER dans LECON_CHOICES (~ligne 200) :                        ║
//  ║       { name: 'Leçon 2 — ...', value: 'lecon2' },                   ║
//  ║                                                                       ║
//  ║  3. PUSH sur GitHub → Railway redéploie ✅                           ║
//  ╚═══════════════════════════════════════════════════════════════════════╝

const LECONS = {
  lecon1: {
    titre: 'Leçon 1 — أسماء الإشارة',
    questions: [
      {
        enonce:      'Quel pronom utilises-tu pour **طَالِبٌ** (étudiant — proche) ?',
        options:     [['هَذَا'], ['ذَلِكَ'], ['هَذِهِ']],
        reponse:     0,
        explication: '**هَذَا** = مفرد مذكر للقريب — singulier masculin proche ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **قَلَمٌ** (stylo — loin) ?',
        options:     [['هَذَا'], ['ذَلِكَ'], ['هَؤُلَاءِ']],
        reponse:     1,
        explication: '**ذَلِكَ** = مفرد مذكر للبعيد — singulier masculin loin ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **مَدْرَسَةٌ** (école — proche) ?',
        options:     [['هَذَا'], ['هَذِهِ'], ['تِلْكَ']],
        reponse:     1,
        explication: '**هَذِهِ** = مفرد مؤنث للقريب — singulier féminin proche ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **حَقِيبَةٌ** (sac — loin) ?',
        options:     [['هَذِهِ'], ['ذَلِكَ'], ['تِلْكَ']],
        reponse:     2,
        explication: '**تِلْكَ** = مفرد مؤنث للبعيد — singulier féminin loin ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **كُتُبٌ** (livres — proche) ? ⚠️ Objets !',
        options:     [['هَؤُلَاءِ'], ['هَذِهِ'], ['هَذَا']],
        reponse:     1,
        explication: '**هَذِهِ** = جمع غير عاقل — pluriel non-humain, toujours هَذِهِ pour les objets ! ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **طَالِبَانِ** (deux étudiants — proche) ?',
        options:     [['هَذَانِ'], ['ذَانِكَ'], ['هَؤُلَاءِ']],
        reponse:     0,
        explication: '**هَذَانِ** = مثنى مذكر للقريب — duel masculin proche ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **بِنْتَانِ** (deux filles — loin) ?',
        options:     [['هَاتَانِ'], ['تَانِكَ'], ['ذَانِكَ']],
        reponse:     1,
        explication: '**تَانِكَ** = مثنى مؤنث للبعيد — duel féminin loin ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **طُلَّابٌ** (étudiants — proche) ? ⚠️ Humains !',
        options:     [['هَذِهِ'], ['أُولَئِكَ'], ['هَؤُلَاءِ']],
        reponse:     2,
        explication: '**هَؤُلَاءِ** = جمع عاقل للقريب — pluriel humain proche ✅',
      },
      {
        enonce:      'Quel pronom utilises-tu pour **طَالِبَاتٌ** (étudiantes — loin) ? ⚠️ Humaines !',
        options:     [['هَؤُلَاءِ'], ['أُولَئِكَ'], ['تِلْكَ']],
        reponse:     1,
        explication: '**أُولَئِكَ** = جمع عاقل للبعيد — pluriel humain loin ✅',
      },
      {
        enonce:      'Au pluriel, les **objets** utilisent **هَؤُلَاءِ** — vrai ou faux ?',
        options:     [['❌ فَاسِدٌ'], ['✅ صَحِيحٌ'], ['أَحْيَانًا']],
        reponse:     0,
        explication: '**فَاسِدٌ (FAUX)** ! Objets au pluriel → toujours **هَذِهِ**. هَؤُلَاءِ = humains seulement ✅',
      },
    ],
  },

  // lecon2: {
  //   titre: 'Leçon 2 — ...',
  //   questions: [
  //     {
  //       enonce:      'Question ?',
  //       options:     [['الخيار أ'], ['الخيار ب'], ['الخيار ج']],
  //       reponse:     0,
  //       explication: 'Explication ✅',
  //     },
  //   ],
  // },
};

// ─── Sessions QCM actives (mémoire) ──────────────────────────────────────────
const qcmSessions = new Map();

// ─── Helpers visuels ─────────────────────────────────────────────────────────

function scoreColor(pct) {
  if (pct >= 85) return 0x0E6655;
  if (pct >= 60) return 0x9A7D0A;
  return 0xB03A2E;
}
function scoreEmoji(pct) {
  if (pct === 100) return '🏆';
  if (pct >= 85)   return '🌟';
  if (pct >= 60)   return '📚';
  return '💪';
}

function buildQuestionEmbed(leconId, qIndex, lastFeedback) {
  const lecon = LECONS[leconId];
  const q     = lecon.questions[qIndex];
  const total = lecon.questions.length;
  const desc  = lastFeedback
    ? `${lastFeedback}\n\n━━━━━━━━━━━━━━━━━━\n\n${q.enonce}`
    : q.enonce;
  return new EmbedBuilder()
    .setTitle(`Question ${qIndex + 1} / ${total}`)
    .setDescription(desc)
    .setColor(0x1A5276)
    .setFooter({ text: lecon.titre });
}

function buildAnswerButtons(leconId, qIndex) {
  const q      = LECONS[leconId].questions[qIndex];
  const labels = ['🅐', '🅑', '🅒'];
  const row    = new ActionRowBuilder();
  q.options.forEach(([ar], i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`qcm_answer_${i}`)
        .setLabel(`${labels[i]}  ${ar}`)
        .setStyle(ButtonStyle.Primary)
    );
  });
  return row;
}

// ─── Vérification rôle professeure ───────────────────────────────────────────

function isProfesseure(interaction) {
  return interaction.member?.roles.cache.some(r => r.name === 'professeure-tome1') ?? false;
}
async function rejectNotProfesseure(interaction) {
  await interaction.reply({
    content: '❌ Cette commande est réservée aux membres avec le rôle **professeure-tome1**.',
    flags: MessageFlags.Ephemeral,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  KHATMA — stockage mémoire (inchangé)
// ══════════════════════════════════════════════════════════════════════════════

const khatmas      = new Map();
const tempUserData = new Map();

function getKhatma(guildId) {
  if (!khatmas.has(guildId)) {
    khatmas.set(guildId, {
      participants: [], listeners: [],
      messageId: null, channelId: null,
      listeMessageId: null, listeChannelId: null,
    });
  }
  return khatmas.get(guildId);
}

const NIVEAU_LABEL = { fluide: 'Fluide', intermediaire: 'Intermédiaire', debutante: 'Débutante' };
function formatPages(p) { return (p === '1 ligne' || p === '1 verset') ? p : `${p} page(s)`; }

function buildListEmbed(khatma) {
  const LTR = '\u200E', BLANK = '\u200B';
  const embed = new EmbedBuilder()
    .setTitle('✨ Khatma — Liste de participation')
    .setColor(0xf4a7c3).setTimestamp().setFooter({ text: 'Dernière mise à jour' });
  const actives       = khatma.participants.filter(p => p.status === 'actif');
  const indisponibles = khatma.participants.filter(p => p.status === 'indisponible');
  if (!khatma.participants.length) {
    embed.addFields({ name: '🌸 Récitatrices', value: `${BLANK}\n*Aucune participante pour l'instant*`, inline: false });
  } else {
    let n = 1;
    const lines = khatma.participants.map(p =>
      p.status === 'indisponible'
        ? `${LTR}⏸️  ${formatPages(p.pages)} — ${p.username}`
        : `${LTR}**${n++}.** 🤍 ${formatPages(p.pages)} — **${p.username}**`
    ).join('\n\n');
    embed.addFields({ name: '🌸 Récitatrices', value: `${LTR}*${actives.length} actives${indisponibles.length ? `, ${indisponibles.length} indisponibles` : ''}*\n${BLANK}\n${lines}`, inline: false });
  }
  if (khatma.listeners.length)
    embed.addFields({ name: '🌺 Sur écoute', value: `${LTR}*${khatma.listeners.length} auditrice(s)*\n${BLANK}\n${khatma.listeners.map(l => `${LTR}🌺 ${l.username}`).join('\n\n')}`, inline: false });
  return embed;
}

function mainButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('khatma_ecoute').setLabel('🌺  J\'écoute').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('khatma_participe').setLabel('🌸  Je participe').setStyle(ButtonStyle.Primary)
  );
}
function statusButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('khatma_rejoindre').setLabel('🌸 Rejoindre la liste').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('khatma_indisponible').setLabel('⏸️ Me mettre indisponible').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('khatma_redevenir_actif').setLabel('✅ Redevenir active').setStyle(ButtonStyle.Secondary)
  );
}
function niveauMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('khatma_niveau')
      .setPlaceholder('Choisir votre niveau de lecture…')
      .addOptions([
        { label: '✨ Fluide',        value: 'fluide',        description: 'Je lis couramment sans hésitation' },
        { label: '🌸 Intermédiaire', value: 'intermediaire', description: 'Je lis avec quelques pauses' },
        { label: '🌺 Débutante',     value: 'debutante',     description: 'Je commence à apprendre' },
      ])
  );
}
function pagesMenu(niveau) {
  const b = [{ label: '1 ligne', value: '1 ligne' }, { label: '1 verset', value: '1 verset' }];
  const m = [...b, { label: '1 page', value: '1', description: 'Une page du Mushaf' }];
  const f = [...m, { label: '2 pages', value: '2' }, { label: '3 pages', value: '3' }];
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('khatma_pages')
      .setPlaceholder('Combien souhaitez-vous lire à chaque passage ?')
      .addOptions(niveau === 'debutante' ? b : niveau === 'intermediaire' ? m : f)
  );
}

async function updateKhatmaMessage(khatma, guild) {
  const pairs = [
    [khatma.channelId, khatma.messageId, mainButtons()],
    [khatma.listeChannelId, khatma.listeMessageId, statusButtons()],
  ];
  for (const [cId, mId, btns] of pairs) {
    if (!cId || !mId) continue;
    try {
      const ch  = guild.channels.cache.get(cId) ?? await guild.channels.fetch(cId);
      const msg = await ch.messages.fetch(mId);
      await msg.edit({ embeds: [buildListEmbed(khatma)], components: [btns] });
    } catch { if (mId === khatma.listeMessageId) { khatma.listeMessageId = null; khatma.listeChannelId = null; } }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMMANDES SLASH
// ══════════════════════════════════════════════════════════════════════════════

// ⬇️ Ajouter chaque nouvelle leçon ici aussi
const LECON_CHOICES = [
  { name: 'Leçon 1 — أسماء الإشارة', value: 'lecon1' },
  // { name: 'Leçon 2 — ...', value: 'lecon2' },
];

const commands = [
  new SlashCommandBuilder()
    .setName('khatma').setDescription('Gérer la khatma')
    .addSubcommand(s => s.setName('start').setDescription('🌙 Démarrer une nouvelle khatma'))
    .addSubcommand(s => s.setName('liste').setDescription('📋 Afficher la liste dans le chat'))
    .addSubcommand(s => s.setName('reset').setDescription('🔄 Réinitialiser la khatma'))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('qcm').setDescription('📝 Lancer un QCM pour les élèves')
    .addStringOption(o => o.setName('lecon').setDescription('Leçon à faire passer').setRequired(false).addChoices(...LECON_CHOICES))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('resultats').setDescription('📊 Récap résultats — rôle professeure-tome1 requis')
    .addStringOption(o => o.setName('lecon').setDescription('Filtrer par leçon').setRequired(false).addChoices(...LECON_CHOICES))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('detail').setDescription('🔍 Détail erreurs d\'une élève — rôle professeure-tome1 requis')
    .addUserOption(o => o.setName('eleve').setDescription('Mentionne l\'élève').setRequired(true))
    .addStringOption(o => o.setName('lecon').setDescription('Filtrer par leçon').setRequired(false).addChoices(...LECON_CHOICES))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('reinitialiser_qcm').setDescription('🗑️ Effacer tous les résultats — rôle professeure-tome1 requis')
    .toJSON(),
];

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Commandes slash enregistrées.');
  } catch (err) { console.error('❌ Erreur enregistrement commandes:', err); }
}

// ══════════════════════════════════════════════════════════════════════════════
//  INTERACTIONS
// ══════════════════════════════════════════════════════════════════════════════

client.on('interactionCreate', async interaction => {
  const userId   = interaction.user.id;
  const username = interaction.member?.displayName ?? interaction.user.username;

  if (interaction.isChatInputCommand()) {
    const cmd = interaction.commandName;

    // ══ KHATMA ══
    if (cmd === 'khatma') {
      const khatma = getKhatma(interaction.guildId);
      const sub    = interaction.options.getSubcommand();
      if (sub === 'start') {
        khatma.participants = []; khatma.listeners = []; khatma.channelId = interaction.channelId;
        await interaction.reply({ embeds: [buildListEmbed(khatma)], components: [mainButtons()] });
        khatma.messageId = (await interaction.fetchReply()).id;
        return;
      }
      if (sub === 'liste') {
        await interaction.reply({ embeds: [buildListEmbed(khatma)], components: [statusButtons()] });
        const m = await interaction.fetchReply();
        khatma.listeMessageId = m.id; khatma.listeChannelId = interaction.channelId;
        return;
      }
      if (sub === 'reset') {
        khatmas.delete(interaction.guildId);
        await interaction.reply({ content: '🔄 Khatma réinitialisée.', flags: MessageFlags.Ephemeral });
        return;
      }
    }

    // ══ QCM — lancer ══
    if (cmd === 'qcm') {
      const leconId = interaction.options.getString('lecon') ?? 'lecon1';
      if (!LECONS[leconId]) { await interaction.reply({ content: '❌ Leçon introuvable.', flags: MessageFlags.Ephemeral }); return; }
      const lecon = LECONS[leconId];
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle(`📖  ${lecon.titre}`)
          .setDescription(`Un nouveau QCM est disponible !\n\n**${lecon.questions.length} questions**\n\nClique sur le bouton pour commencer.\nLes questions n'apparaîtront **que pour toi** 🤲`)
          .setColor(0x1A5276)],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`qcm_start_${leconId}`).setLabel('📝  Commencer le QCM').setStyle(ButtonStyle.Success)
        )],
      });
      return;
    }

    // ══ RÉSULTATS (prof) ══
    if (cmd === 'resultats') {
      if (!isProfesseure(interaction)) { await rejectNotProfesseure(interaction); return; }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const data  = await readAllResults(interaction.options.getString('lecon') ?? '');
      const lines = Object.values(data).flatMap(info => {
        if (!info.sessions.length) return [];
        const derniere = info.sessions.at(-1);
        const moy = Math.round(info.sessions.reduce((a, s) => a + s.pct, 0) / info.sessions.length);
        return [`${scoreEmoji(derniere.pct)} **${info.username}** — Dernière : ${derniere.score}/${derniere.total} (${derniere.pct}%) | Moy : ${moy}% | Essais : ${info.sessions.length}`];
      });
      if (!lines.length) { await interaction.editReply('Aucun résultat enregistré.'); return; }
      await interaction.editReply({ embeds: [new EmbedBuilder()
        .setTitle('📊  Récapitulatif').setDescription(lines.join('\n')).setColor(0x1C2833).setTimestamp()
        .setFooter({ text: `${lines.length} élève(s) enregistrée(s)` })] });
      return;
    }

    // ══ DÉTAIL (prof) ══
    if (cmd === 'detail') {
      if (!isProfesseure(interaction)) { await rejectNotProfesseure(interaction); return; }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const membre = interaction.options.getUser('eleve');
      const data   = await readAllResults(interaction.options.getString('lecon') ?? '');
      const info   = data[membre.id];
      if (!info) { await interaction.editReply(`Aucun résultat pour **${membre.username}**.`); return; }
      const embed = new EmbedBuilder().setTitle(`🔍  Détail — ${info.username}`).setColor(0xE67E22);
      for (const s of info.sessions.slice(-3)) {
        const errs = s.erreurs.length ? s.erreurs.map(e => `• ${e.reponseDonnee} ✗ → ${e.bonneReponse}`).join('\n') : '✅ Aucune erreur !';
        embed.addFields({ name: `${s.date} — ${s.lecon} — ${s.score}/${s.total} (${s.pct}%)`, value: errs, inline: false });
      }
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // ══ RÉINITIALISER (prof) ══
    if (cmd === 'reinitialiser_qcm') {
      if (!isProfesseure(interaction)) { await rejectNotProfesseure(interaction); return; }
      saveResults({});
      await interaction.reply({ content: '🗑️ Tous les résultats ont été effacés.', flags: MessageFlags.Ephemeral });
      return;
    }
  }

  if (interaction.isButton()) {
    const id     = interaction.customId;
    const khatma = getKhatma(interaction.guildId);

    // ══ KHATMA boutons ══
    if (id === 'khatma_ecoute') {
      khatma.participants = khatma.participants.filter(p => p.userId !== userId);
      if (!khatma.listeners.find(l => l.userId === userId)) khatma.listeners.push({ userId, username, joinedAt: new Date() });
      await updateKhatmaMessage(khatma, interaction.guild);
      await interaction.reply({ content: '🌺 Tu as été ajoutée à la liste des auditrices !', flags: MessageFlags.Ephemeral });
      return;
    }
    if (id === 'khatma_participe' || id === 'khatma_rejoindre') {
      await interaction.reply({ content: '🌸 **Quel est votre niveau de lecture ?**', components: [niveauMenu()], flags: MessageFlags.Ephemeral });
      return;
    }
    if (id === 'khatma_indisponible') {
      const p = khatma.participants.find(p => p.userId === userId);
      if (p) { p.status = 'indisponible'; await updateKhatmaMessage(khatma, interaction.guild); await interaction.reply({ content: '⏸️ Marquée indisponible.', flags: MessageFlags.Ephemeral }); }
      else await interaction.reply({ content: '❌ Tu ne fais pas partie de la liste.', flags: MessageFlags.Ephemeral });
      return;
    }
    if (id === 'khatma_redevenir_actif') {
      const p = khatma.participants.find(p => p.userId === userId);
      if (p) { p.status = 'actif'; p.username = username; await updateKhatmaMessage(khatma, interaction.guild); await interaction.reply({ content: '✅ Tu es de nouveau active !', flags: MessageFlags.Ephemeral }); }
      else await interaction.reply({ content: '❌ Tu ne fais pas partie de la liste.', flags: MessageFlags.Ephemeral });
      return;
    }

    // ══ QCM — démarrer ══
    if (id.startsWith('qcm_start_')) {
      const leconId = id.replace('qcm_start_', '');
      if (qcmSessions.has(userId)) {
        await interaction.reply({ content: '⚠️ Tu as déjà un QCM en cours !', flags: MessageFlags.Ephemeral });
        return;
      }
      qcmSessions.set(userId, { leconId, qIndex: 0, score: 0, erreurs: [] });
      const embed = buildQuestionEmbed(leconId, 0, null);
      embed.setAuthor({ name: `QCM — ${LECONS[leconId].titre}` });
      embed.setFooter({ text: 'Seule toi vois ces messages 🤲' });
      await interaction.reply({ embeds: [embed], components: [buildAnswerButtons(leconId, 0)], flags: MessageFlags.Ephemeral });
      return;
    }

    // ══ QCM — répondre ══
    if (id.startsWith('qcm_answer_')) {
      const sess = qcmSessions.get(userId);
      if (!sess) {
        await interaction.reply({ content: '❌ Aucun QCM actif. Utilise /qcm pour commencer.', flags: MessageFlags.Ephemeral });
        return;
      }
      const choice  = parseInt(id.replace('qcm_answer_', ''), 10);
      const lecon   = LECONS[sess.leconId];
      const q       = lecon.questions[sess.qIndex];
      const total   = lecon.questions.length;
      const correct = choice === q.reponse;

      if (correct) {
        sess.score++;
      } else {
        sess.erreurs.push({ question: q.enonce, reponseDonnee: q.options[choice][0], bonneReponse: q.options[q.reponse][0] });
      }

      const feedback = correct
        ? `✅  ${q.explication}`
        : `❌  Bonne réponse : **${q.options[q.reponse][0]}**\n${q.explication}`;

      sess.qIndex++;

      // ── Dernière question → résultat final ──
      if (sess.qIndex >= total) {
        const { score, erreurs, leconId } = sess;
        qcmSessions.delete(userId);
        await appendResult(userId, username, leconId, score, total, erreurs);
        const pct = Math.round(score / total * 100);
        const msg = pct === 100 ? 'مَاشَاءَ اللَّهُ — Parfait, aucune erreur ! 🎉'
          : pct >= 85 ? 'جَيِّدٌ جِدًّا — Très bien ! 📖'
          : pct >= 60 ? 'لَا بَأْسَ — Continue tes révisions ! 💪'
          : 'اِجْتَهِدْ — Relis le cours avant de réessayer 📚';
        const embed = new EmbedBuilder()
          .setTitle(`${scoreEmoji(pct)}  Résultat final — ${lecon.titre}`)
          .setColor(scoreColor(pct))
          .addFields(
            { name: 'Dernière question', value: feedback, inline: false },
            { name: 'Score final', value: `**${score} / ${total}**  (${pct}%)`, inline: false },
            { name: '\u200B', value: msg, inline: false }
          );
        if (erreurs.length)
          embed.addFields({ name: 'Tes erreurs', value: erreurs.map(e => `• ${e.reponseDonnee} ✗ → ${e.bonneReponse}`).join('\n'), inline: false });
        await interaction.update({ embeds: [embed], components: [] });
        return;
      }

      // ── Question suivante — feedback AVANT la question ──
      await interaction.update({
        embeds:     [buildQuestionEmbed(sess.leconId, sess.qIndex, feedback)],
        components: [buildAnswerButtons(sess.leconId, sess.qIndex)],
      });
      return;
    }
  }

  if (interaction.isStringSelectMenu()) {
    const khatma = getKhatma(interaction.guildId);
    if (interaction.customId === 'khatma_niveau') {
      const niveau = interaction.values[0];
      tempUserData.set(userId, { niveau });
      await interaction.update({ content: `🌸 Niveau : **${NIVEAU_LABEL[niveau]}**\n\n✨ **Combien souhaitez-vous lire ?**`, components: [pagesMenu(niveau)] });
      return;
    }
    if (interaction.customId === 'khatma_pages') {
      const pages  = interaction.values[0];
      const niveau = (tempUserData.get(userId) ?? {}).niveau ?? 'intermediaire';
      tempUserData.delete(userId);
      khatma.listeners = khatma.listeners.filter(l => l.userId !== userId);
      const existing = khatma.participants.find(p => p.userId === userId);
      if (existing) Object.assign(existing, { niveau, pages, status: 'actif', username });
      else khatma.participants.push({ userId, username, niveau, pages, status: 'actif', joinedAt: new Date() });
      await updateKhatmaMessage(khatma, interaction.guild);
      await interaction.update({ content: `✅ C'est noté ! Tu vas lire **${formatPages(pages)}** à chaque passage.\nBienvenue dans la khatma 🤍✨`, components: [] });
      return;
    }
  }
});

// ─── Démarrage ────────────────────────────────────────────────────────────────

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  await registerCommands();
});

client.login(TOKEN);
