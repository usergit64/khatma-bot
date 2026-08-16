/**
 * commands.js — Définition et enregistrement des commandes slash Discord
 *
 * ► Pour AJOUTER une commande : créer un nouveau SlashCommandBuilder ici,
 *   l'ajouter au tableau `commands`, et gérer l'interaction dans index.js.
 *
 * ► Pour AJOUTER une leçon aux menus QCM : ajouter l'entrée dans
 *   LECON_CHOICES (lecons.js) et la même ici dans addChoices().
 *
 * Commandes disponibles :
 *   /qcm [lecon]           — Lance un QCM (visible uniquement par l'élève)
 *   /resultats [lecon]     — Récap résultats (rôle professeure-tome1 requis)
 *   /detail @eleve [lecon] — Détail erreurs d'une élève (prof uniquement)
 *   /reinitialiser_qcm     — Efface tous les résultats (prof uniquement)
 *   /khatma start|liste|reset — Gère la khatma
 */

const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { LECON_CHOICES } = require('./lecons');

const commands = [
  new SlashCommandBuilder()
    .setName('khatma')
    .setDescription('Gérer la khatma')
    .addSubcommand(s => s.setName('start').setDescription('🌙 Démarrer une nouvelle khatma'))
    .addSubcommand(s => s.setName('liste').setDescription('📋 Afficher la liste dans le chat'))
    .addSubcommand(s => s.setName('reset').setDescription('🔄 Réinitialiser la khatma'))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('qcm')
    .setDescription('📝 Lancer un QCM pour les élèves')
    .addStringOption(o =>
      o.setName('lecon')
        .setDescription('Leçon à faire passer')
        .setRequired(false)
        .addChoices(...LECON_CHOICES)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName('resultats')
    .setDescription('📊 Récap résultats — rôle professeure-tome1 requis')
    .addStringOption(o =>
      o.setName('lecon')
        .setDescription('Filtrer par leçon')
        .setRequired(false)
        .addChoices(...LECON_CHOICES)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName('detail')
    .setDescription('🔍 Détail erreurs d\'une élève — rôle professeure-tome1 requis')
    .addUserOption(o =>
      o.setName('eleve').setDescription('Mentionne l\'élève').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('lecon')
        .setDescription('Filtrer par leçon')
        .setRequired(false)
        .addChoices(...LECON_CHOICES)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName('reinitialiser_qcm')
    .setDescription('🗑️ Effacer tous les résultats — rôle professeure-tome1 requis')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('appel')
    .setDescription('📋 Appel quotidien Cours Tome 1')
    .addSubcommand(s =>
      s.setName('resultats')
        .setDescription('Voir les présences du jour (ou d\'une date)')
        .addStringOption(o =>
          o.setName('date')
            .setDescription('Date au format YYYY-MM-DD (ex: 2026-08-16)')
            .setRequired(false)
        )
    )
    .addSubcommand(s =>
      s.setName('now')
        .setDescription('Envoyer l\'appel maintenant — rôle professeure-tome1 requis')
    )
    .addSubcommand(s =>
      s.setName('test')
        .setDescription('Test dans ce salon avec toi + oum khalil — rôle professeure-tome1 requis')
    )
    .toJSON(),
];

const GUILD_ID = '827186013209100299';

async function registerCommands(token, clientId) {
  const rest = new REST({ version: '10' }).setToken(token);
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, GUILD_ID), { body: commands });
    console.log('✅ Commandes slash enregistrées (guilde).');
  } catch (err) {
    console.error('❌ Erreur enregistrement commandes:', err);
  }
}

module.exports = { registerCommands };
