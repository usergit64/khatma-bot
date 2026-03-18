require('dotenv').config();
const {
  Client, GatewayIntentBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, EmbedBuilder,
  MessageFlags,
  REST, Routes, SlashCommandBuilder
} = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ─── Client ────────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ─── Stockage en mémoire ───────────────────────────────────────────────────

const khatmas = new Map();      // guildId → KhatmaData
const tempUserData = new Map(); // userId  → { niveau }

function getKhatma(guildId) {
  if (!khatmas.has(guildId)) {
    khatmas.set(guildId, {
      participants:   [],   // { userId, username, niveau, pages, status, joinedAt }
      listeners:      [],   // { userId, username, joinedAt }
      messageId:      null,
      channelId:      null,
      listeMessageId: null, // message /khatma liste (live)
      listeChannelId: null
    });
  }
  return khatmas.get(guildId);
}

// ─── Commandes slash ───────────────────────────────────────────────────────

const commands = [
  new SlashCommandBuilder()
    .setName('khatma')
    .setDescription('Gérer la khatma')
    .addSubcommand(s => s.setName('start').setDescription('🌙 Démarrer une nouvelle khatma'))
    .addSubcommand(s => s.setName('liste').setDescription('📋 Afficher la liste dans le chat'))
    .addSubcommand(s => s.setName('reset').setDescription('🔄 Réinitialiser la khatma'))
    .toJSON()
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

// ─── Construction des embeds ───────────────────────────────────────────────

const NIVEAU_LABEL = { fluide: 'Fluide', intermediaire: 'Intermédiaire', debutante: 'Débutante' };

function formatPages(pages) {
  if (pages === '1 ligne')  return '1 ligne';
  if (pages === '1 verset') return '1 verset';
  return `${pages} page(s)`;
}

function buildListEmbed(khatma) {
  const LTR = '\u200E'; // forcer l'alignement gauche même avec du texte arabe
  const BLANK = '\u200B'; // ligne vide visible dans Discord

  const embed = new EmbedBuilder()
    .setTitle('✨ Khatma — Liste de participation')
    .setColor(0xf4a7c3)
    .setTimestamp()
    .setFooter({ text: 'Dernière mise à jour' });

  // ── Récitatrices ──
  const actives       = khatma.participants.filter(p => p.status === 'actif');
  const indisponibles = khatma.participants.filter(p => p.status === 'indisponible');

  if (khatma.participants.length === 0) {
    embed.addFields({
      name:  `🌸 Récitatrices`,
      value: `${BLANK}\n*Aucune participante pour l'instant*`,
      inline: false
    });
  } else {
    let num = 1;
    const lines = khatma.participants.map(p => {
      const pg = formatPages(p.pages);
      if (p.status === 'indisponible') {
        return `${LTR}⏸️  ${pg} — ${p.username}`;
      }
      return `${LTR}**${num++}.** 🤍 ${pg} — **${p.username}**`;
    }).join('\n\n');

    const countLine = `${actives.length} actives${indisponibles.length ? `, ${indisponibles.length} indisponibles` : ''}`;

    embed.addFields({
      name:  `🌸 Récitatrices`,
      value: `${LTR}*${countLine}*\n${BLANK}\n${lines}`,
      inline: false
    });
  }

  // ── Auditrices ──
  if (khatma.listeners.length > 0) {
    const lines = khatma.listeners.map(l => `${LTR}🌺 ${l.username}`).join('\n\n');
    embed.addFields({
      name:  `🌺 Sur écoute`,
      value: `${LTR}*${khatma.listeners.length} auditrice(s)*\n${BLANK}\n${lines}`,
      inline: false
    });
  }

  return embed;
}

// ─── Construction des composants ──────────────────────────────────────────

function mainButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('khatma_ecoute')
      .setLabel('🌺  J\'écoute')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('khatma_participe')
      .setLabel('🌸  Je participe')
      .setStyle(ButtonStyle.Primary)
  );
}

function statusButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('khatma_rejoindre')
      .setLabel('🌸 Rejoindre la liste')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('khatma_indisponible')
      .setLabel('⏸️ Me mettre indisponible')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('khatma_redevenir_actif')
      .setLabel('✅ Redevenir active')
      .setStyle(ButtonStyle.Secondary)
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
  let options = [];

  if (niveau === 'debutante') {
    options = [
      { label: '1 ligne',  value: '1 ligne',  description: 'Une seule ligne' },
      { label: '1 verset', value: '1 verset', description: 'Un verset complet' },
    ];
  } else if (niveau === 'intermediaire') {
    options = [
      { label: '1 ligne',  value: '1 ligne',  description: 'Une seule ligne' },
      { label: '1 verset', value: '1 verset', description: 'Un verset complet' },
      { label: '1 page',   value: '1',        description: 'Une page du Mushaf' },
    ];
  } else if (niveau === 'fluide') {
    options = [
      { label: '1 ligne',  value: '1 ligne',  description: 'Une seule ligne' },
      { label: '1 verset', value: '1 verset', description: 'Un verset complet' },
      { label: '1 page',   value: '1',        description: 'Une page du Mushaf' },
      { label: '2 pages',  value: '2',        description: 'Deux pages du Mushaf' },
      { label: '3 pages',  value: '3',        description: 'Trois pages du Mushaf' },
    ];
  }

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('khatma_pages')
      .setPlaceholder('Combien souhaitez-vous lire à chaque passage ?')
      .addOptions(options)
  );
}

// ─── Mise à jour du message principal ─────────────────────────────────────

async function updateKhatmaMessage(khatma, guild) {
  // ── Message principal (/khatma start) ──
  if (khatma.channelId && khatma.messageId) {
    try {
      const channel = guild.channels.cache.get(khatma.channelId)
                   ?? await guild.channels.fetch(khatma.channelId);
      const message = await channel.messages.fetch(khatma.messageId);
      await message.edit({ embeds: [buildListEmbed(khatma)], components: [mainButtons()] });
    } catch (err) {
      console.error('⚠️  Impossible de mettre à jour le message principal:', err.message);
    }
  }

  // ── Message liste (/khatma liste) ──
  if (khatma.listeChannelId && khatma.listeMessageId) {
    try {
      const channel = guild.channels.cache.get(khatma.listeChannelId)
                   ?? await guild.channels.fetch(khatma.listeChannelId);
      const message = await channel.messages.fetch(khatma.listeMessageId);
      await message.edit({ embeds: [buildListEmbed(khatma)], components: [statusButtons()] });
    } catch (err) {
      khatma.listeMessageId = null;
      khatma.listeChannelId = null;
      console.error('⚠️  Message liste introuvable, réinitialisé:', err.message);
    }
  }
}

// ─── Gestion des interactions ─────────────────────────────────────────────

client.on('interactionCreate', async interaction => {
  const khatma  = getKhatma(interaction.guildId);
  const userId   = interaction.user.id;
  const username = interaction.member?.displayName ?? interaction.user.username;

  // ── Commandes slash ──────────────────────────────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'khatma') {
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      // Réinitialise si déjà une khatma
      khatma.participants = [];
      khatma.listeners    = [];
      khatma.channelId    = interaction.channelId;

      await interaction.reply({
        embeds:     [buildListEmbed(khatma)],
        components: [mainButtons()]
      });
      const msg = await interaction.fetchReply();
      khatma.messageId = msg.id;
      return;
    }

    if (sub === 'liste') {
      await interaction.reply({
        embeds:     [buildListEmbed(khatma)],
        components: [statusButtons()]
      });
      const listeMsg = await interaction.fetchReply();
      khatma.listeMessageId = listeMsg.id;
      khatma.listeChannelId = interaction.channelId;
      return;
    }

    if (sub === 'reset') {
      khatmas.delete(interaction.guildId);
      await interaction.reply({ content: '🔄 Khatma réinitialisée avec succès.', flags: MessageFlags.Ephemeral });
      return;
    }
  }

  // ── Boutons ──────────────────────────────────────────────────────────────
  if (interaction.isButton()) {

    // --- J'écoute ---
    if (interaction.customId === 'khatma_ecoute') {
      khatma.participants = khatma.participants.filter(p => p.userId !== userId);
      if (!khatma.listeners.find(l => l.userId === userId)) {
        khatma.listeners.push({ userId, username, joinedAt: new Date() });
      }
      await updateKhatmaMessage(khatma, interaction.guild);
      await interaction.reply({ content: '🌺 Tu as été ajoutée à la liste des auditrices !', flags: MessageFlags.Ephemeral });
      return;
    }

    // --- Je participe / Rejoindre ---
    if (interaction.customId === 'khatma_participe' || interaction.customId === 'khatma_rejoindre') {
      await interaction.reply({
        content: '🌸 **Quel est votre niveau de lecture ?**',
        components: [niveauMenu()],
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // --- Me mettre indisponible ---
    if (interaction.customId === 'khatma_indisponible') {
      const p = khatma.participants.find(p => p.userId === userId);
      if (p) {
        p.status = 'indisponible';
        await updateKhatmaMessage(khatma, interaction.guild);
        await interaction.reply({ content: '⏸️ Tu as été marquée comme indisponible.', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: '❌ Tu ne fais pas partie de la liste des récitatrices.', flags: MessageFlags.Ephemeral });
      }
      return;
    }

    // --- Redevenir active ---
    if (interaction.customId === 'khatma_redevenir_actif') {
      const p = khatma.participants.find(p => p.userId === userId);
      if (p) {
        p.status   = 'actif';
        p.username = username;
        await updateKhatmaMessage(khatma, interaction.guild);
        await interaction.reply({ content: '✅ Tu es de nouveau active dans la liste !', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: '❌ Tu ne fais pas partie de la liste des récitatrices.', flags: MessageFlags.Ephemeral });
      }
      return;
    }
  }

  // ── Menus sélecteurs ─────────────────────────────────────────────────────
  if (interaction.isStringSelectMenu()) {

    // --- Sélection du niveau ---
    if (interaction.customId === 'khatma_niveau') {
      const niveau = interaction.values[0];
      tempUserData.set(userId, { niveau });

      const niveauLabel = NIVEAU_LABEL[niveau];

      await interaction.update({
        content:    `🌸 Niveau : **${niveauLabel}**\n\n✨ **Combien souhaitez-vous lire à chaque passage ?**`,
        components: [pagesMenu(niveau)]
      });
      return;
    }

    // --- Sélection du nombre de pages ---
    if (interaction.customId === 'khatma_pages') {
      const pages  = interaction.values[0];
      const temp   = tempUserData.get(userId) ?? {};
      const niveau = temp.niveau ?? 'intermediaire';
      tempUserData.delete(userId);

      // Retirer des auditrices si nécessaire
      khatma.listeners = khatma.listeners.filter(l => l.userId !== userId);

      // Ajouter ou mettre à jour dans les participantes
      const existing = khatma.participants.find(p => p.userId === userId);
      if (existing) {
        existing.niveau   = niveau;
        existing.pages    = pages;
        existing.status   = 'actif';
        existing.username = username;
      } else {
        khatma.participants.push({
          userId, username, niveau, pages,
          status:   'actif',
          joinedAt: new Date()
        });
      }

      await updateKhatmaMessage(khatma, interaction.guild);

      await interaction.update({
        content:    `✅ C'est noté ! Tu vas lire **${formatPages(pages)}** à chaque passage.\nBienvenue dans la khatma 🤍✨`,
        components: []
      });
      return;
    }
  }
});

// ─── Démarrage ────────────────────────────────────────────────────────────

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  await registerCommands();
});

client.login(TOKEN);
