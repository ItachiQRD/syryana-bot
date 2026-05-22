import { generateDependencyReport } from '@discordjs/voice';
import { ActivityType } from 'discord.js';
import { BRAND, env } from '../config.js';
import { startScheduler } from '../scheduler.js';
import { loadVerificationConfig } from '../systems/verification.js';
import { checkGuildSetup } from '../systems/guild-health.js';

export async function onReady(client) {
  console.log(`✅ ${client.user.tag} — Bot Syryana en ligne`);
  console.log('[voix]', generateDependencyReport().replaceAll('\n', ' | '));
  client.user.setActivity({
    name: `${BRAND.name} | /syryana`,
    type: ActivityType.Playing,
  });

  loadVerificationConfig();
  startScheduler(client);

  if (env.guildId) {
    const guild = client.guilds.cache.get(env.guildId)
      ?? await client.guilds.fetch(env.guildId).catch(() => null);
    if (guild) {
      const { issues, ok } = checkGuildSetup(guild);
      ok.forEach((m) => console.log('✓', m));
      issues.forEach((m) => console.warn('⚠️', m));
    }
  }

  if (env.verificationChannelId && !env.skipVerificationPanelOnStart) {
    console.log('📋 Panneau vérification : utilise /panel-verification si besoin (pas de message au démarrage)');
  }

  const guildCount = client.guilds.cache.size;
  if (guildCount > 0) {
    console.log(`📡 Connecté à ${guildCount} serveur(s). Arrête toute autre instance du bot (PC local + Render = doublons).`);
  }
}
