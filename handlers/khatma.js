const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');
const { load, save, reset } = require('../utils/khatma-storage');

const tempUserData = new Map();

const NIVEAU_LABEL = { fluide: 'Fluide', intermediaire: 'Intermédiaire', debutante: 'Débutante' };

function formatPages(p) {
  const passthrough = ['1 ligne', '3 lignes', '1 verset', '3 versets'];
  return passthrough.includes(p) ? p : `${p} page(s)`;
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

  if (!khatma.participants.length) {
    embed.addFields({ name: '🌸 Récitatrices', value: `${BLANK}\n*Aucune participante pour l'instant*`, inline: false });
  } else {
    let n = 1;
    const lines = khatma.participants.map(p =>
      p.status === 'indisponible'
        ? `${LTR}⏸️  ${formatPages(p.pages)} — ${p.username}`
        : `${LTR}**${n++}.** 🤍 ${formatPages(p.pages)} — **${p.username}**`
    ).join('\n\n');
    embed.addFields({
      name:   '🌸 Récitatrices',
      value:  `${LTR}*${actives.length} actives${indisponibles.length ? `, ${indisponibles.length} indisponibles` : ''}*\n${BLANK}\n${lines}`,
      inline: false,
    });
  }

  if (khatma.listeners.length) {
    embed.addFields({
      name:   '🌺 Sur écoute',
      value:  `${LTR}*${khatma.listeners.length} auditrice(s)*\n${BLANK}\n${khatma.listeners.map(l => `${LTR}🌺 ${l.username}`).join('\n\n')}`,
      inline: false,
    });
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
        { label: '🌺 Débutante',     value: 'debutante',     description: 'Je commence à apprendre' },
      ])
  );
}

function pagesMenu(niveau) {
  const basique = [
    { label: '1 ligne',   value: '1 ligne' },
    { label: '3 lignes',  value: '3 lignes' },
    { label: '1 verset',  value: '1 verset' },
    { label: '3 versets', value: '3 versets' },
  ];
  const intermediaire = [...basique, { label: '1 page', value: '1', description: 'Une page du Mushaf' }];
  const fluide        = [...intermediaire, { label: '2 pages', value: '2' }, { label: '3 pages', value: '3' }];
  const options = niveau === 'debutante' ? basique : niveau === 'intermediaire' ? intermediaire : fluide;
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('khatma_pages')
      .setPlaceholder('Combien souhaitez-vous lire à chaque passage ?')
      .addOptions(options)
  );
}

async function updateKhatmaMessage(khatma, guild) {
  const pairs = [
    [khatma.channelId,      khatma.messageId,      mainButtons()],
    [khatma.listeChannelId, khatma.listeMessageId,  statusButtons()],
  ];
  for (const [cId, mId, btns] of pairs) {
    if (!cId || !mId) continue;
    try {
      const ch  = guild.channels.cache.get(cId) ?? await guild.channels.fetch(cId);
      const msg = await ch.messages.fetch(mId);
      await msg.edit({ embeds: [buildListEmbed(khatma)], components: [btns] });
    } catch {
      if (mId === khatma.listeMessageId) { khatma.listeMessageId = null; khatma.listeChannelId = null; }
    }
  }
}

async function handleKhatmaCommand(interaction) {
  const khatma = load(interaction.guildId);
  const sub    = interaction.options.getSubcommand();

  if (sub === 'start') {
    const fresh = { participants: [], listeners: [], channelId: interaction.channelId, messageId: null, listeMessageId: null, listeChannelId: null };
    await interaction.reply({ embeds: [buildListEmbed(fresh)], components: [mainButtons()] });
    fresh.messageId = (await interaction.fetchReply()).id;
    save(interaction.guildId, fresh);
    return;
  }

  if (sub === 'liste') {
    await interaction.reply({ embeds: [buildListEmbed(khatma)], components: [statusButtons()] });
    const m = await interaction.fetchReply();
    khatma.listeMessageId  = m.id;
    khatma.listeChannelId  = interaction.channelId;
    save(interaction.guildId, khatma);
    return;
  }

  if (sub === 'reset') {
    reset(interaction.guildId);
    await interaction.reply({ content: '🔄 Khatma réinitialisée.', flags: MessageFlags.Ephemeral });
  }
}

async function handleKhatmaButton(interaction) {
  const id       = interaction.customId;
  const userId   = interaction.user.id;
  const username = interaction.member?.displayName ?? interaction.user.username;
  const khatma   = load(interaction.guildId);

  if (id === 'khatma_ecoute') {
    khatma.participants = khatma.participants.filter(p => p.userId !== userId);
    if (!khatma.listeners.find(l => l.userId === userId)) {
      khatma.listeners.push({ userId, username, joinedAt: new Date().toISOString() });
    }
    save(interaction.guildId, khatma);
    await interaction.reply({ content: '🌺 Tu as été ajoutée à la liste des auditrices !', flags: MessageFlags.Ephemeral });
    updateKhatmaMessage(khatma, interaction.guild).catch(() => {});
    return;
  }

  if (id === 'khatma_participe' || id === 'khatma_rejoindre') {
    await interaction.reply({ content: '🌸 **Quel est votre niveau de lecture ?**', components: [niveauMenu()], flags: MessageFlags.Ephemeral });
    return;
  }

  if (id === 'khatma_indisponible') {
    const p = khatma.participants.find(p => p.userId === userId);
    if (p) {
      p.status = 'indisponible';
      save(interaction.guildId, khatma);
      await interaction.reply({ content: '⏸️ Marquée indisponible.', flags: MessageFlags.Ephemeral });
      updateKhatmaMessage(khatma, interaction.guild).catch(() => {});
    } else {
      await interaction.reply({ content: '❌ Tu ne fais pas partie de la liste.', flags: MessageFlags.Ephemeral });
    }
    return;
  }

  if (id === 'khatma_redevenir_actif') {
    const p = khatma.participants.find(p => p.userId === userId);
    if (p) {
      p.status   = 'actif';
      p.username = username;
      save(interaction.guildId, khatma);
      await interaction.reply({ content: '✅ Tu es de nouveau active !', flags: MessageFlags.Ephemeral });
      updateKhatmaMessage(khatma, interaction.guild).catch(() => {});
    } else {
      await interaction.reply({ content: '❌ Tu ne fais pas partie de la liste.', flags: MessageFlags.Ephemeral });
    }
  }
}

async function handleKhatmaSelectMenu(interaction) {
  const userId   = interaction.user.id;
  const username = interaction.member?.displayName ?? interaction.user.username;
  const khatma   = load(interaction.guildId);

  if (interaction.customId === 'khatma_niveau') {
    const niveau = interaction.values[0];
    tempUserData.set(userId, { niveau });
    await interaction.update({
      content:    `🌸 Niveau : **${NIVEAU_LABEL[niveau]}**\n\n✨ **Combien souhaitez-vous lire ?**`,
      components: [pagesMenu(niveau)],
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
      khatma.participants.push({ userId, username, niveau, pages, status: 'actif', joinedAt: new Date().toISOString() });
    }
    save(interaction.guildId, khatma);
    await interaction.update({
      content:    `✅ C'est noté ! Tu vas lire **${formatPages(pages)}** à chaque passage.\nBienvenue dans la khatma 🤍✨`,
      components: [],
    });
    updateKhatmaMessage(khatma, interaction.guild).catch(() => {});
  }
}

module.exports = { handleKhatmaCommand, handleKhatmaButton, handleKhatmaSelectMenu };
