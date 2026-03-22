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

// ─── Client ────────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ══════════════════════════════════════════════════════════════════════════════
//  KHATMA — stockage en mémoire
// ══════════════════════════════════════════════════════════════════════════════

const khatmas      = new Map(); // guildId → KhatmaData
const tempUserData = new Map(); // userId  → { niveau }

function getKhatma(guildId) {
  if (!khatmas.has(guildId)) {
    khatmas.set(guildId, {
      participants:   [],
      listeners:      [],
      messageId:      null,
      channelId:      null,
      listeMessageId: null,
      listeChannelId: null
    });
  }
  return khatmas.get(guildId);
}

// ══════════════════════════════════════════════════════════════════════════════
//  QCM — données
// ══════════════════════════════════════════════════════════════════════════════

const LECONS = {
  lecon1: {
    titre: 'Leçon 1 — أسماء الإشارة',
    questions: [
      {
        enonce:   'Quel pronom utilises-tu pour **طَالِبٌ** (étudiant — proche) ?',
        options:  [['هَذَا','proche masc.'], ['ذَلِكَ','loin masc.'], ['هَذِهِ','fém.']],
        reponse:  0,
        explication: '**هَذَا** = singulier masculin proche ✅'
      },
      {
        enonce:   'Quel pronom utilises-tu pour **قَلَمٌ** (stylo — loin) ?',
        options:  [['هَذَا','proche masc.'], ['ذَلِكَ','loin masc.'], ['هَؤُلَاءِ','plur. hum.']],
        reponse:  1,
        explication: '**ذَلِكَ** = singulier masculin loin ✅'
      },
      {
        enonce:   'Quel pronom utilises-tu pour **مَدْرَسَةٌ** (école — proche) ?',
        options:  [['هَذَا','masc. sing.'], ['هَذِهِ','proche fém.'], ['تِلْكَ','loin fém.']],
        reponse:  1,
        explication: '**هَذِهِ** = singulier féminin proche ✅'
      },
      {
        enonce:   'Quel pronom utilises-tu pour **حَقِيبَةٌ** (sac — loin) ?',
        options:  [['هَذِهِ','proche fém.'], ['ذَلِكَ','loin masc.'], ['تِلْكَ','loin fém.']],
        reponse:  2,
        explication: '**تِلْكَ** = singulier féminin loin ✅'
      },
      {
        enonce:   'Quel pronom utilises-tu pour **كُتُبٌ** (livres — proche, objets) ?',
        options:  [['هَؤُلَاءِ','plur. humain'], ['هَذِهِ','plur. non-humain'], ['هَذَا','sing. masc.']],
        reponse:  1,
        explication: '**هَذِهِ** = pluriel non-humain (objets/animaux) → toujours هَذِهِ ! ✅'
      },
      {
        enonce:   'Quel pronom utilises-tu pour **طَالِبَانِ** (deux étudiants — proche) ?',
        options:  [['هَذَانِ','duel masc. proche'], ['ذَانِكَ','duel masc. loin'], ['هَؤُلَاءِ','plur. hum.']],
        reponse:  0,
        explication: '**هَذَانِ** = duel masculin proche ✅'
      },
      {
        enonce:   'Quel pronom utilises-tu pour **بِنْتَانِ** (deux filles — loin) ?',
        options:  [['هَاتَانِ','duel fém. proche'], ['تَانِكَ','duel fém. loin'], ['ذَانِكَ','duel masc. loin']],
        reponse:  1,
        explication: '**تَانِكَ** = duel féminin loin ✅'
      },
      {
        enonce:   'Quel pronom utilises-tu pour **طُلَّابٌ** (étudiants — proche, humains) ?',
        options:  [['هَذِهِ','plur. non-humain'], ['أُولَئِكَ','plur. hum. loin'], ['هَؤُلَاءِ','plur. hum. proche']],
        reponse:  2,
        explication: '**هَؤُلَاءِ** = pluriel humain proche ✅'
      },
      {
        enonce:   'Quel pronom utilises-tu pour **طَالِبَاتٌ** (étudiantes — loin) ?',
        options:  [['هَؤُلَاءِ','plur. hum. proche'], ['أُولَئِكَ','plur. hum. loin'], ['تِلْكَ','sing. fém. loin']],
        reponse:  1,
        explication: '**أُولَئِكَ** = pluriel humain loin ✅'
      },
      {
        enonce:   'Vrai ou faux : au pluriel, les **objets** utilisent **هَؤُلَاءِ** ?',
        options:  [['❌ Faux','objets → هَذِهِ'], ['✅ Vrai','objets → هَؤُلَاءِ'], ['Seulement au féminin','']],
        reponse:  0,
        explication: '**FAUX** ! Les objets (غير عاقل) → toujours **هَذِهِ**. هَؤُلَاءِ = humains seulement ✅'
      }
    ]
  }
};

// ─── QCM — sessions en cours (mémoire) ──────────────────────────────────────
// userId → { leconId, qIndex, score, erreurs: [] }
const qcmSessions = new Map();

// ─── QCM — résultats (fichier JSON) ─────────────────────────────────────────
const RESULTS_FILE = 'resultats_qcm.json';

function loadResults() {
  try {
    if (fs.existsSync(RESULTS_FILE)) return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
  } catch { /* ignore */ }
  return {};
}

function saveResults(data) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function recordResult(userId, username, leconId, score, total, erreurs) {
  const data    = loadResults();
  if (!data[userId]) data[userId] = { username, sessions: [] };
  data[userId].username = username; // màj pseudo si changé
  data[userId].sessions.push({
    lecon:   leconId,
    date:    new Date().toLocaleString('fr-FR'),
    score,
    total,
    pct:     Math.round(score / total * 100),
    erreurs  // [{ question, reponseDonnee, bonneReponse }]
  });
  saveResults(data);
}

// ─── QCM — helpers ───────────────────────────────────────────────────────────

function scoreColor(pct) {
  if (pct >= 85) return 0x0E6655; // vert
  if (pct >= 60) return 0x9A7D0A; // or
  return 0xB03A2E;                 // rouge
}
function scoreEmoji(pct) {
  if (pct === 100) return '🏆';
  if (pct >= 85)   return '🌟';
  if (pct >= 60)   return '📚';
  return '💪';
}

function buildQuestionEmbed(leconId, qIndex, score, feedbackLine) {
  const lecon = LECONS[leconId];
  const q     = lecon.questions[qIndex];
  const total = lecon.questions.length;

  const embed = new EmbedBuilder()
    .setTitle(`Question ${qIndex + 1} / ${total}`)
    .setDescription(q.enonce)
    .setColor(0x1A5276);

  if (feedbackLine) embed.setFooter({ text: feedbackLine.slice(0, 100) });
  return embed;
}

function buildAnswerButtons(leconId, qIndex) {
  const q       = LECONS[leconId].questions[qIndex];
  const labels  = ['🅐', '🅑', '🅒'];
  const row     = new ActionRowBuilder();

  q.options.forEach(([ar, hint], i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`qcm_answer_${i}`)
        .setLabel(`${labels[i]}  ${ar}${hint ? '  —  ' + hint : ''}`)
        .setStyle(ButtonStyle.Primary)
    );
  });
  return row;
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMMANDES SLASH
// ══════════════════════════════════════════════════════════════════════════════

const commands = [
  // ── Khatma ──
  new SlashCommandBuilder()
    .setName('khatma')
    .setDescription('Gérer la khatma')
    .addSubcommand(s => s.setName('start').setDescription('🌙 Démarrer une nouvelle khatma'))
    .addSubcommand(s => s.setName('liste').setDescription('📋 Afficher la liste dans le chat'))
    .addSubcommand(s => s.setName('reset').setDescription('🔄 Réinitialiser la khatma'))
    .toJSON(),

  // ── QCM ──
  new SlashCommandBuilder()
    .setName('qcm')
    .setDescription('📝 Lancer un QCM pour les élèves (prof)')
    .addStringOption(o =>
      o.setName('lecon')
        .setDescription('Identifiant de la leçon')
        .setRequired(false)
        .addChoices({ name: 'Leçon 1 — أسماء الإشارة', value: 'lecon1' })
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName('resultats')
    .setDescription('📊 Voir le récap des résultats de toutes les élèves (prof)')
    .addStringOption(o =>
      o.setName('lecon')
        .setDescription('Filtrer par leçon (optionnel)')
        .setRequired(false)
        .addChoices({ name: 'Leçon 1', value: 'lecon1' })
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName('detail')
    .setDescription('🔍 Voir le détail des erreurs d\'une élève (prof)')
    .addUserOption(o => o.setName('eleve').setDescription('Mentionne l\'élève').setRequired(true))
    .addStringOption(o =>
      o.setName('lecon').setDescription('Filtrer par leçon').setRequired(false)
        .addChoices({ name: 'Leçon 1', value: 'lecon1' })
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName('reinitialiser_qcm')
    .setDescription('🗑️ Effacer tous les résultats QCM (prof — irréversible)')
    .toJSON(),
];

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Commandes slash enregistrées.');
  } catch (err) {
    console.error('❌ Erreur enregistrement commandes:', err);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  KHATMA — embeds & composants
// ══════════════════════════════════════════════════════════════════════════════

const NIVEAU_LABEL = { fluide: 'Fluide', intermediaire: 'Intermédiaire', debutante: 'Débutante' };

function formatPages(pages) {
  if (pages === '1 ligne')  return '1 ligne';
  if (pages === '1 verset') return '1 verset';
  return `${pages} page(s)`;
}

function buildListEmbed(khatma) {
  const LTR   = '\u200E';
  const BLANK = '\u200B';

  const embed = new EmbedBuilder()
    .setTitle('✨ Khatma — Liste de participation')
    .setColor(0xf4a7c3)
    .setTimestamp()
    .setFooter({ text: 'Dernière mise à jour' });

  const actives       = khatma.participants.filter(p => p.status === 'actif');
  const indisponibles = khatma.participants.filter(p => p.status === 'indisponible');

  if (khatma.participants.length === 0) {
    embed.addFields({ name: '🌸 Récitatrices', value: `${BLANK}\n*Aucune participante pour l'instant*`, inline: false });
  } else {
    let num = 1;
    const lines = khatma.participants.map(p => {
      const pg = formatPages(p.pages);
      if (p.status === 'indisponible') return `${LTR}⏸️  ${pg} — ${p.username}`;
      return `${LTR}**${num++}.** 🤍 ${pg} — **${p.username}**`;
    }).join('\n\n');

    const countLine = `${actives.length} actives${indisponibles.length ? `, ${indisponibles.length} indisponibles` : ''}`;
    embed.addFields({ name: '🌸 Récitatrices', value: `${LTR}*${countLine}*\n${BLANK}\n${lines}`, inline: false });
  }

  if (khatma.listeners.length > 0) {
    const lines = khatma.listeners.map(l => `${LTR}🌺 ${l.username}`).join('\n\n');
    embed.addFields({ name: '🌺 Sur écoute', value: `${LTR}*${khatma.listeners.length} auditrice(s)*\n${BLANK}\n${lines}`, inline: false });
  }

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
    new StringSelectMenuBuilder()
      .setCustomId('khatma_niveau')
      .setPlaceholder('Choisir votre niveau de lecture…')
      .addOptions([
        { label: '✨ Fluide',        value: 'fluide',        description: 'Je lis couramment sans hésitation' },
        { label: '🌸 Intermédiaire', value: 'intermediaire', description: 'Je lis avec quelques pauses' },
        { label: '🌺 Débutante',     value: 'debutante',     description: 'Je commence à apprendre' }
      ])
  );
}

function pagesMenu(niveau) {
  const opts = niveau === 'debutante'
    ? [{ label: '1 ligne', value: '1 ligne', description: 'Une seule ligne' }, { label: '1 verset', value: '1 verset', description: 'Un verset complet' }]
    : niveau === 'intermediaire'
      ? [{ label: '1 ligne', value: '1 ligne' }, { label: '1 verset', value: '1 verset' }, { label: '1 page', value: '1', description: 'Une page du Mushaf' }]
      : [{ label: '1 ligne', value: '1 ligne' }, { label: '1 verset', value: '1 verset' }, { label: '1 page', value: '1' }, { label: '2 pages', value: '2' }, { label: '3 pages', value: '3' }];

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('khatma_pages')
      .setPlaceholder('Combien souhaitez-vous lire à chaque passage ?')
      .addOptions(opts)
  );
}

async function updateKhatmaMessage(khatma, guild) {
  if (khatma.channelId && khatma.messageId) {
    try {
      const channel = guild.channels.cache.get(khatma.channelId) ?? await guild.channels.fetch(khatma.channelId);
      const message = await channel.messages.fetch(khatma.messageId);
      await message.edit({ embeds: [buildListEmbed(khatma)], components: [mainButtons()] });
    } catch (err) {
      console.error('⚠️  Impossible de mettre à jour le message principal:', err.message);
    }
  }
  if (khatma.listeChannelId && khatma.listeMessageId) {
    try {
      const channel = guild.channels.cache.get(khatma.listeChannelId) ?? await guild.channels.fetch(khatma.listeChannelId);
      const message = await channel.messages.fetch(khatma.listeMessageId);
      await message.edit({ embeds: [buildListEmbed(khatma)], components: [statusButtons()] });
    } catch (err) {
      khatma.listeMessageId = null;
      khatma.listeChannelId = null;
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  GESTION DES INTERACTIONS
// ══════════════════════════════════════════════════════════════════════════════

client.on('interactionCreate', async interaction => {
  const userId   = interaction.user.id;
  const username = interaction.member?.displayName ?? interaction.user.username;

  // ── Commandes slash ────────────────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const cmd = interaction.commandName;

    // ════ KHATMA ════
    if (cmd === 'khatma') {
      const khatma = getKhatma(interaction.guildId);
      const sub    = interaction.options.getSubcommand();

      if (sub === 'start') {
        khatma.participants = [];
        khatma.listeners    = [];
        khatma.channelId    = interaction.channelId;
        await interaction.reply({ embeds: [buildListEmbed(khatma)], components: [mainButtons()] });
        const msg = await interaction.fetchReply();
        khatma.messageId = msg.id;
        return;
      }
      if (sub === 'liste') {
        await interaction.reply({ embeds: [buildListEmbed(khatma)], components: [statusButtons()] });
        const listeMsg = await interaction.fetchReply();
        khatma.listeMessageId = listeMsg.id;
        khatma.listeChannelId = interaction.channelId;
        return;
      }
      if (sub === 'reset') {
        khatmas.delete(interaction.guildId);
        await interaction.reply({ content: '🔄 Khatma réinitialisée.', flags: MessageFlags.Ephemeral });
        return;
      }
    }

    // ════ QCM — lancer ════
    if (cmd === 'qcm') {
      const leconId = interaction.options.getString('lecon') ?? 'lecon1';
      if (!LECONS[leconId]) {
        await interaction.reply({ content: '❌ Leçon introuvable.', flags: MessageFlags.Ephemeral });
        return;
      }
      const lecon = LECONS[leconId];
      const embed = new EmbedBuilder()
        .setTitle(`📖  ${lecon.titre}`)
        .setDescription(
          `Un nouveau QCM est disponible !\n\n` +
          `**${lecon.questions.length} questions** sur les pronoms démonstratifs.\n\n` +
          `Clique sur le bouton ci-dessous pour commencer.\n` +
          `Les questions n'apparaîtront que pour toi 🤲`
        )
        .setColor(0x1A5276)
        .setFooter({ text: 'Bonne chance à toutes — In shaa Allah !' });

      const startBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`qcm_start_${leconId}`)
          .setLabel('📝  Commencer le QCM')
          .setStyle(ButtonStyle.Success)
      );
      await interaction.reply({ embeds: [embed], components: [startBtn] });
      return;
    }

    // ════ QCM — résultats ════
    if (cmd === 'resultats') {
      const filtre = interaction.options.getString('lecon') ?? '';
      const data   = loadResults();
      const lines  = [];

      for (const [uid, info] of Object.entries(data)) {
        const sessions = info.sessions.filter(s => !filtre || s.lecon === filtre);
        if (!sessions.length) continue;
        const derniere = sessions.at(-1);
        const moy      = Math.round(sessions.reduce((a, s) => a + s.pct, 0) / sessions.length);
        lines.push(
          `${scoreEmoji(derniere.pct)} **${info.username}** — ` +
          `Dernière : ${derniere.score}/${derniere.total} (${derniere.pct}%) | ` +
          `Moy. : ${moy}% | Essais : ${sessions.length}`
        );
      }

      if (!lines.length) {
        await interaction.reply({ content: 'Aucun résultat enregistré pour l\'instant.', flags: MessageFlags.Ephemeral });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`📊  Récapitulatif${filtre ? ' — ' + filtre : ''}`)
        .setDescription(lines.join('\n'))
        .setColor(0x1C2833)
        .setTimestamp()
        .setFooter({ text: `${lines.length} élève(s) enregistrée(s)` });

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    // ════ QCM — détail ════
    if (cmd === 'detail') {
      const membre = interaction.options.getUser('eleve');
      const filtre = interaction.options.getString('lecon') ?? '';
      const data   = loadResults();
      const info   = data[membre.id];

      if (!info) {
        await interaction.reply({ content: `Aucun résultat pour ${membre.username}.`, flags: MessageFlags.Ephemeral });
        return;
      }

      const sessions = info.sessions.filter(s => !filtre || s.lecon === filtre).slice(-3);
      const embed    = new EmbedBuilder()
        .setTitle(`🔍  Détail — ${info.username}`)
        .setColor(0xE67E22);

      for (const s of sessions) {
        const errs = s.erreurs.length
          ? s.erreurs.map(e => `• ${e.reponseDonnee} ✗ → ${e.bonneReponse}`).join('\n')
          : '✅ Aucune erreur !';
        embed.addFields({ name: `${s.date} — ${s.lecon} — ${s.score}/${s.total} (${s.pct}%)`, value: errs, inline: false });
      }

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    // ════ QCM — réinitialiser ════
    if (cmd === 'reinitialiser_qcm') {
      saveResults({});
      await interaction.reply({ content: '🗑️ Tous les résultats QCM ont été effacés.', flags: MessageFlags.Ephemeral });
      return;
    }
  }

  // ── Boutons ────────────────────────────────────────────────────────────────
  if (interaction.isButton()) {
    const id = interaction.customId;

    // ════ KHATMA boutons ════
    const khatma = getKhatma(interaction.guildId);

    if (id === 'khatma_ecoute') {
      khatma.participants = khatma.participants.filter(p => p.userId !== userId);
      if (!khatma.listeners.find(l => l.userId === userId))
        khatma.listeners.push({ userId, username, joinedAt: new Date() });
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
      if (p) { p.status = 'indisponible'; await updateKhatmaMessage(khatma, interaction.guild); await interaction.reply({ content: '⏸️ Tu as été marquée comme indisponible.', flags: MessageFlags.Ephemeral }); }
      else    await interaction.reply({ content: '❌ Tu ne fais pas partie de la liste.', flags: MessageFlags.Ephemeral });
      return;
    }
    if (id === 'khatma_redevenir_actif') {
      const p = khatma.participants.find(p => p.userId === userId);
      if (p) { p.status = 'actif'; p.username = username; await updateKhatmaMessage(khatma, interaction.guild); await interaction.reply({ content: '✅ Tu es de nouveau active !', flags: MessageFlags.Ephemeral }); }
      else    await interaction.reply({ content: '❌ Tu ne fais pas partie de la liste.', flags: MessageFlags.Ephemeral });
      return;
    }

    // ════ QCM — démarrer ════
    if (id.startsWith('qcm_start_')) {
      const leconId = id.replace('qcm_start_', '');
      if (qcmSessions.has(userId)) {
        await interaction.reply({ content: '⚠️ Tu as déjà un QCM en cours ! Continue de répondre.', flags: MessageFlags.Ephemeral });
        return;
      }
      qcmSessions.set(userId, { leconId, qIndex: 0, score: 0, erreurs: [] });

      const embed = buildQuestionEmbed(leconId, 0, 0, null);
      embed.setAuthor({ name: `QCM — ${LECONS[leconId].titre}` });
      embed.setFooter({ text: 'Seule toi vois ce message — bonne chance ! 🤲' });

      await interaction.reply({ embeds: [embed], components: [buildAnswerButtons(leconId, 0)], flags: MessageFlags.Ephemeral });
      return;
    }

    // ════ QCM — répondre ════
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
        sess.erreurs.push({
          question:      q.enonce,
          reponseDonnee: q.options[choice][0],
          bonneReponse:  q.options[q.reponse][0]
        });
      }

      const feedback = correct
        ? `✅ ${q.explication}`
        : `❌ Pas tout à fait ! Bonne réponse : **${q.options[q.reponse][0]}** — ${q.explication}`;

      sess.qIndex++;

      // ── Dernière question → résultat final ──
      if (sess.qIndex >= total) {
        const { score, erreurs, leconId } = sess;
        qcmSessions.delete(userId);
        recordResult(userId, username, leconId, score, total, erreurs);

        const pct = Math.round(score / total * 100);
        let msg = '';
        if (pct === 100) msg = 'مَاشَاءَ اللَّهُ — Parfait, aucune erreur ! 🎉';
        else if (pct >= 85) msg = 'جَيِّدٌ جِدًّا — Très bien ! Encore un peu de révision 📖';
        else if (pct >= 60) msg = 'لَا بَأْسَ — Continue tes révisions, tu progresses ! 💪';
        else msg = 'اِجْتَهِدْ — Relis bien le cours avant de réessayer 📚';

        const embed = new EmbedBuilder()
          .setTitle(`${scoreEmoji(pct)}  Résultat final — ${lecon.titre}`)
          .setColor(scoreColor(pct))
          .addFields(
            { name: 'Score', value: `**${score} / ${total}**  (${pct}%)`, inline: false },
            { name: 'Dernière question', value: feedback, inline: false },
            { name: '', value: msg, inline: false }
          );

        if (erreurs.length) {
          embed.addFields({
            name: 'Tes erreurs',
            value: erreurs.map(e => `• ${e.reponseDonnee} ✗ → ${e.bonneReponse}`).join('\n'),
            inline: false
          });
        }

        await interaction.update({ embeds: [embed], components: [] });
        return;
      }

      // ── Question suivante ──
      const nextEmbed = buildQuestionEmbed(sess.leconId, sess.qIndex, sess.score, feedback);
      await interaction.update({ embeds: [nextEmbed], components: [buildAnswerButtons(sess.leconId, sess.qIndex)] });
      return;
    }
  }

  // ── Menus sélecteurs (khatma) ──────────────────────────────────────────────
  if (interaction.isStringSelectMenu()) {
    const khatma = getKhatma(interaction.guildId);

    if (interaction.customId === 'khatma_niveau') {
      const niveau = interaction.values[0];
      tempUserData.set(userId, { niveau });
      await interaction.update({
        content:    `🌸 Niveau : **${NIVEAU_LABEL[niveau]}**\n\n✨ **Combien souhaitez-vous lire à chaque passage ?**`,
        components: [pagesMenu(niveau)]
      });
      return;
    }

    if (interaction.customId === 'khatma_pages') {
      const pages  = interaction.values[0];
      const niveau = (tempUserData.get(userId) ?? {}).niveau ?? 'intermediaire';
      tempUserData.delete(userId);

      khatma.listeners = khatma.listeners.filter(l => l.userId !== userId);
      const existing   = khatma.participants.find(p => p.userId === userId);
      if (existing) {
        Object.assign(existing, { niveau, pages, status: 'actif', username });
      } else {
        khatma.participants.push({ userId, username, niveau, pages, status: 'actif', joinedAt: new Date() });
      }

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
