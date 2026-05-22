process.env.TZ = process.env.TZ || 'Europe/Paris';

import './health-server.js';

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config.js';
import { onReady } from './events/ready.js';
import { onInteractionCreate } from './events/interactionCreate.js';
import { onMessageCreate } from './events/messageCreate.js';
import { onGuildMemberAdd } from './events/guildMemberAdd.js';
import { onVoiceStateUpdate } from './events/voiceStateUpdate.js';

if (!env.token) {
  console.error('❌ DISCORD_TOKEN manquant. Copie .env.example vers .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.once('ready', () => onReady(client));
client.on('interactionCreate', onInteractionCreate);
client.on('messageCreate', onMessageCreate);
client.on('guildMemberAdd', onGuildMemberAdd);
client.on('voiceStateUpdate', onVoiceStateUpdate);

client.on('error', (err) => console.error('Erreur client Discord:', err));
client.on('shardDisconnect', (_event, id) => console.warn(`[discord] Shard ${id} déconnecté — reconnexion…`));
client.on('shardReconnecting', (id) => console.log(`[discord] Shard ${id} reconnecte…`));
client.on('shardResume', (id) => console.log(`[discord] Shard ${id} reconnecté`));

process.on('unhandledRejection', (err) => {
  console.error('Promesse rejetée (bot reste actif):', err);
});

process.on('uncaughtException', (err) => {
  console.error('Exception non gérée:', err);
});

process.on('SIGTERM', () => {
  console.log('🛑 Arrêt Render (redéploiement ou mise en veille)…');
  client.destroy();
  setTimeout(() => process.exit(0), 2000);
});

client.login(env.token).catch((err) => {
  console.error('❌ Connexion Discord impossible:', err.message);
  process.exit(1);
});
