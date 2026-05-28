import { PermissionFlagsBits } from 'discord.js';
import { env } from '../config.js';

export function checkGuildSetup(guild) {
  const issues = [];
  const ok = [];
  const me = guild.members.me;

  if (!me) {
    issues.push('Le bot n\'est pas sur ce serveur (vérifie GUILD_ID et réinvite le bot).');
    return { issues, ok };
  }

  if (env.memberRoleId) {
    if (!guild.roles.cache.has(env.memberRoleId)) {
      issues.push('Rôle Membre introuvable (mauvais MEMBER_ROLE_ID).');
    } else ok.push('Rôle Membre configuré');
  }

  if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    issues.push('Le bot n\'a pas **Gérer les rôles** (utile pour le rôle Membre auto à l\'arrivée).');
  } else ok.push('Permission Gérer les rôles : OK');

  if (!env.quizChannelId) {
    issues.push('`QUIZ_CHANNEL_ID` vide — quiz auto désactivé.');
  } else {
    const ch = guild.channels.cache.get(env.quizChannelId);
    if (!ch) issues.push('Salon quiz introuvable.');
    else if (!ch.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages)) {
      issues.push('Le bot ne peut pas **envoyer de messages** dans le salon quiz.');
    } else ok.push('Salon quiz accessible');
  }

  if (env.vipRoleId && !guild.roles.cache.has(env.vipRoleId)) {
    issues.push('Rôle VIP introuvable (VIP_ROLE_ID).');
  } else if (env.vipRoleId) ok.push('Rôle VIP configuré');

  return { issues, ok };
}
