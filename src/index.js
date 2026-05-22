process.env.TZ = process.env.TZ || 'Europe/Paris';

import './health-server.js';

import sodium from 'libsodium-wrappers';
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

await sodium.ready;

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

process.on('unhandledRejection', (err) => {
  console.error('Promesse rejetée:', err);
});

client.login(env.token);
