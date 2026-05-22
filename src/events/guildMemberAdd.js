import { syryanaEmbed } from '../utils/embeds.js';
import { BRAND, env } from '../config.js';
import { applyUnverifiedRole } from '../systems/verification.js';

const recentJoins = new Map();

async function tryAssignUnverified(member, attempt = 1) {
  const result = await applyUnverifiedRole(member);
  if (result.ok && !result.skipped) return true;

  if (result.reason === 'no_manage_roles' || result.reason === 'role_hierarchy') {
    if (attempt === 1) {
      console.error('[verif] ⚠️ Donne au bot **Gérer les rôles** et place-le AU-DESSUS de « Non vérifié »');
    }
    return false;
  }

  if (attempt < 3) {
    await new Promise((r) => setTimeout(r, attempt * 2000));
    return tryAssignUnverified(member, attempt + 1);
  }
  return false;
}

export async function onGuildMemberAdd(member) {
  try {
    if (member.partial) await member.fetch();
  } catch (e) {
    console.error('[verif] Impossible de charger le membre:', e.message);
  }

  const joinKey = `${member.guild.id}:${member.id}`;
  const last = recentJoins.get(joinKey);
  if (last && Date.now() - last < 30_000) return;
  recentJoins.set(joinKey, Date.now());

  await tryAssignUnverified(member);

  const verificationChannel = env.verificationChannelId
    ? member.guild.channels.cache.get(env.verificationChannelId)
    : null;

  if (verificationChannel?.isTextBased()) {
    // Un seul petit message — le panneau épinglé a le bouton Commencer
    await verificationChannel.send({
      content: [
        `${member}`,
        `Bienvenue sur **${BRAND.name}** ${BRAND.emoji}`,
        '👉 Lis le message **épinglé** et clique **Commencer**, ou tape `/verifier`.',
      ].join('\n'),
    }).catch((e) => console.error('[verif] Ping accueil:', e.message));
    return;
  }

  const channelId = env.welcomeChannelId;
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel?.isTextBased()) return;

  await channel.send({
    content: `${member} ${BRAND.emoji}`,
    embeds: [syryanaEmbed('Bienvenue', 'Configure `VERIFICATION_CHANNEL_ID` pour la vérification.')],
  }).catch(() => {});
}
