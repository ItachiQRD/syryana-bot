import { generateDependencyReport } from '@discordjs/voice';
import { ActivityType } from 'discord.js';
import { BRAND, env } from '../config.js';
import { startScheduler } from '../scheduler.js';
import { loadVerificationConfig } from '../systems/verification.js';
import { refreshPinnedPanel } from '../systems/verification-panel.js';
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

  if (env.verificationChannelId && env.guildId) {
    const guild = client.guilds.cache.get(env.guildId);
    const channel = guild?.channels.cache.get(env.verificationChannelId);
    if (channel?.isTextBased()) {
      loadVerificationConfig();
      await refreshPinnedPanel(channel, client).catch(() => null);
      console.log('📋 Panneau vérification mis à jour (1 message épinglé)');
    }
  }
}
