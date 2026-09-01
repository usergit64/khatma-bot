const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('khatma')
    .setDescription('Gérer la khatma')
    .addSubcommand(s => s.setName('start').setDescription('🌙 Démarrer une nouvelle khatma'))
    .addSubcommand(s => s.setName('liste').setDescription('📋 Afficher la liste dans le chat'))
    .addSubcommand(s => s.setName('reset').setDescription('🔄 Réinitialiser la khatma'))
    .toJSON(),
];

const GUILD_ID = '827186013209100299';

async function registerCommands(token, clientId) {
  const rest = new REST({ version: '10' }).setToken(token);
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    await rest.put(Routes.applicationGuildCommands(clientId, GUILD_ID), { body: commands });
    console.log('✅ Commandes slash enregistrées (guilde).');
  } catch (err) {
    console.error('❌ Erreur enregistrement commandes:', err);
  }
}

module.exports = { registerCommands };
