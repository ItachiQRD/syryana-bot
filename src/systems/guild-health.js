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

  if (!env.unverifiedRoleId) {
    issues.push('`UNVERIFIED_ROLE_ID` vide dans .env');
  } else if (!guild.roles.cache.has(env.unverifiedRoleId)) {
    issues.push('Rôle Non vérifié introuvable (mauvais ID dans .env)');
  } else ok.push('Rôle Non vérifié configuré');

  if (!env.memberRoleId) {
    issues.push('`MEMBER_ROLE_ID` vide dans .env');
  } else if (!guild.roles.cache.has(env.memberRoleId)) {
    issues.push('Rôle Membre introuvable (mauvais ID dans .env)');
  } else ok.push('Rôle Membre configuré');

  if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    issues.push('Le bot n\'a pas **Gérer les rôles** (Admin ou permission explicite).');
  } else ok.push('Permission Gérer les rôles : OK');

  const botTop = me.roles.highest.position;
  const unverified = env.unverifiedRoleId && guild.roles.cache.get(env.unverifiedRoleId);
  const memberRole = env.memberRoleId && guild.roles.cache.get(env.memberRoleId);

  if (unverified && botTop <= unverified.position) {
    issues.push(
      'Le rôle du **bot** doit être **au-dessus** du rôle « Non vérifié » dans Paramètres serveur → Rôles (glisser-déposer).'
    );
  } else if (unverified) ok.push('Hiérarchie bot > Non vérifié : OK');

  if (memberRole && botTop <= memberRole.position) {
    issues.push('Le rôle du **bot** doit être **au-dessus** du rôle « Membre ».');
  }

  if (!env.quizChannelId) {
    issues.push('`QUIZ_CHANNEL_ID` vide — quiz auto désactivé.');
  } else {
    const ch = guild.channels.cache.get(env.quizChannelId);
    if (!ch) issues.push('Salon quiz introuvable.');
    else if (!ch.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages)) {
      issues.push('Le bot ne peut pas **envoyer de messages** dans le salon quiz.');
    } else ok.push('Salon quiz accessible');
  }

  issues.push(
    '**Permissions salons :** @everyone ne doit **pas** voir #général, #quiz, etc. Seuls les rôles Membre (et staff) doivent les voir. Sinon les nouveaux voient tout même sans rôle.'
  );

  return { issues, ok, botTop, unverifiedPos: unverified?.position, memberPos: memberRole?.position };
}
