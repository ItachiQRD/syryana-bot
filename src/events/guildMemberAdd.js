import { PermissionFlagsBits } from 'discord.js';
import { syryanaEmbed } from '../utils/embeds.js';
import { BRAND, env } from '../config.js';

const recentJoins = new Map();

export async function onGuildMemberAdd(member) {
  try {
    if (member.partial) await member.fetch();
  } catch (e) {
    console.error('[bienvenue] Impossible de charger le membre:', e.message);
  }

  const joinKey = `${member.guild.id}:${member.id}`;
  const last = recentJoins.get(joinKey);
  if (last && Date.now() - last < 30_000) return;
  recentJoins.set(joinKey, Date.now());

  if (env.memberRoleId) {
    const role = member.guild.roles.cache.get(env.memberRoleId);
    if (role && member.guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await member.roles.add(role).catch(() => {});
    }
  }

  const channelId = env.welcomeChannelId;
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel?.isTextBased()) return;

  await channel.send({
    content: `${member} ${BRAND.emoji}`,
    embeds: [syryanaEmbed(
      `Bienvenue sur ${BRAND.name}`,
      [
        `Salut **${member.user.username}** ! ${BRAND.tagline}`,
        '',
        '• `/syryana` — guide du serveur',
        '• `/quotidien` — récompense quotidienne',
        '• `/profil` — ton XP et tes pièces',
        '• Quiz du soir, duels, boutique… amuse-toi bien !',
      ].join('\n')
    )],
    allowedMentions: { users: [member.id] },
  }).catch(() => {});
}
