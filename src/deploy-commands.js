import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import { commands } from './commands/index.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('DISCORD_TOKEN et CLIENT_ID requis dans .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

try {
  // Supprime les commandes GLOBALES (cause des doublons avec celles du serveur)
  await rest.put(Routes.applicationCommands(clientId), { body: [] });
  console.log('🧹 Commandes globales supprimées (plus de doublons)');

  if (!guildId) {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`✅ ${commands.length} commandes globales déployées`);
    process.exit(0);
  }

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
  console.log(`✅ ${commands.length} commandes sur le serveur ${guildId} (une seule fois)`);

  const global = await rest.get(Routes.applicationCommands(clientId));
  const guild = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
  console.log(`   Global: ${global.length} | Serveur: ${guild.length}`);
} catch (e) {
  if (e.code === 50001 || e.code === 50013) {
    console.error('❌ Bot pas sur ce serveur ou sans droit. Réinvite-le avec applications.commands');
  } else {
    console.error(e);
  }
  process.exit(1);
}
