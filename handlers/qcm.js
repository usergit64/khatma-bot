/**
 * handlers/qcm.js — Logique complète du QCM
 *
 * Gère les sessions actives (une par utilisateur), les questions/réponses,
 * le calcul du score et l'affichage des résultats.
 *
 * ► Une session QCM est privée (ephemeral) — seule l'élève voit les questions.
 * ► La professeure lance /qcm dans le channel ; une session s'ouvre pour chaque élève qui clique.
 *
 * Flux :
 *   1. /qcm → message public avec bouton "Commencer"
 *   2. Clic "Commencer" → session créée, première question affichée (privée)
 *   3. Chaque réponse → feedback + question suivante
 *   4. Dernière question → résultat final + sauvegarde
 */

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');
const { LECONS } = require('../lecons');
const { appendResult } = require('../utils/storage');

// Sessions actives : Map<userId, { leconId, qIndex, score, erreurs }>
const sessions = new Map();

// ── Helpers visuels ──────────────────────────────────────────────────────────

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

function scoreMessage(pct) {
  if (pct === 100) return 'مَاشَاءَ اللَّهُ — Parfait, aucune erreur ! 🎉';
  if (pct >= 85)   return 'جَيِّدٌ جِدًّا — Très bien ! 📖';
  if (pct >= 60)   return 'لَا بَأْسَ — Continue tes révisions ! 💪';
  return 'اِجْتَهِدْ — Relis le cours avant de réessayer 📚';
}

// ── Constructeurs d'embeds et de boutons ─────────────────────────────────────

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
  q.options.forEach(([text], i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`qcm_answer_${i}`)
        .setLabel(`${labels[i]}  ${text}`)
        .setStyle(ButtonStyle.Primary)
    );
  });
  return row;
}

// ── Handlers d'interaction ───────────────────────────────────────────────────

// Commande /qcm — affiche le bouton de démarrage dans le channel
async function handleQcmCommand(interaction) {
  const leconId = interaction.options.getString('lecon') ?? 'lecon1';
  const lecon   = LECONS[leconId];
  if (!lecon) {
    await interaction.reply({ content: '❌ Leçon introuvable.', flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`📖  ${lecon.titre}`)
        .setDescription(
          `Un nouveau QCM est disponible !\n\n` +
          `**${lecon.questions.length} questions**\n\n` +
          `Clique sur le bouton pour commencer.\n` +
          `Les questions n'apparaîtront **que pour toi** 🤲`
        )
        .setColor(0x1A5276)
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`qcm_start_${leconId}`)
          .setLabel('📝  Commencer le QCM')
          .setStyle(ButtonStyle.Success)
      )
    ],
  });
}

// Bouton "Commencer" — crée une session et envoie la première question
async function handleQcmStart(interaction, leconId) {
  const userId = interaction.user.id;
  if (sessions.has(userId)) {
    await interaction.reply({ content: '⚠️ Tu as déjà un QCM en cours !', flags: MessageFlags.Ephemeral });
    return;
  }
  sessions.set(userId, { leconId, qIndex: 0, score: 0, erreurs: [] });
  const embed = buildQuestionEmbed(leconId, 0, null);
  embed.setAuthor({ name: `QCM — ${LECONS[leconId].titre}` });
  embed.setFooter({ text: 'Seule toi vois ces messages 🤲' });
  await interaction.reply({
    embeds:     [embed],
    components: [buildAnswerButtons(leconId, 0)],
    flags:      MessageFlags.Ephemeral,
  });
}

// Bouton de réponse — évalue, passe à la question suivante ou affiche le résultat
async function handleQcmAnswer(interaction, choiceIndex) {
  const userId   = interaction.user.id;
  const username = interaction.member?.displayName ?? interaction.user.username;
  const sess     = sessions.get(userId);

  if (!sess) {
    await interaction.reply({ content: '❌ Aucun QCM actif. Utilise /qcm pour commencer.', flags: MessageFlags.Ephemeral });
    return;
  }

  const lecon   = LECONS[sess.leconId];
  const q       = lecon.questions[sess.qIndex];
  const total   = lecon.questions.length;
  const correct = choiceIndex === q.reponse;

  if (correct) {
    sess.score++;
  } else {
    sess.erreurs.push({
      question:      q.enonce,
      reponseDonnee: q.options[choiceIndex][0],
      bonneReponse:  q.options[q.reponse][0],
    });
  }

  const feedback = correct
    ? `✅  ${q.explication}`
    : `❌  Bonne réponse : **${q.options[q.reponse][0]}**\n${q.explication}`;

  sess.qIndex++;

  // Dernière question → résultat final
  if (sess.qIndex >= total) {
    const { score, erreurs, leconId } = sess;
    sessions.delete(userId);
    appendResult(userId, username, leconId, score, total, erreurs);

    const pct   = Math.round(score / total * 100);
    const embed = new EmbedBuilder()
      .setTitle(`${scoreEmoji(pct)}  Résultat — ${lecon.titre}`)
      .setColor(scoreColor(pct))
      .addFields(
        { name: 'Dernière question', value: feedback, inline: false },
        { name: 'Score final', value: `**${score} / ${total}**  (${pct}%)`, inline: false },
        { name: '\u200B', value: scoreMessage(pct), inline: false }
      );

    if (erreurs.length) {
      embed.addFields({
        name:  'Tes erreurs',
        value: erreurs.map(e => `• ${e.reponseDonnee} ✗ → ${e.bonneReponse}`).join('\n'),
        inline: false,
      });
    }

    await interaction.update({ embeds: [embed], components: [] });
    return;
  }

  // Question suivante avec feedback intégré
  await interaction.update({
    embeds:     [buildQuestionEmbed(sess.leconId, sess.qIndex, feedback)],
    components: [buildAnswerButtons(sess.leconId, sess.qIndex)],
  });
}

module.exports = { handleQcmCommand, handleQcmStart, handleQcmAnswer };
