import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { claimDaily, getProfile, grantXp } from '../systems/xp.js';
import db, { getLeaderboard, getUser } from '../db.js';
import { listShop, purchase } from '../systems/shop.js';
import { startDailyQuiz } from '../systems/quiz.js';
import { spinDaily } from '../systems/spin.js';
import { startDuel } from '../systems/duel.js';
import { buildPoll } from '../systems/poll.js';
import {
  startVerification,
  loadVerificationConfig,
  getVerificationConfig,
  syncUnverifiedRoles,
  resetVerification,
  retryUnverifiedRole,
} from '../systems/verification.js';
import { checkGuildSetup } from '../systems/guild-health.js';
import { syryanaEmbed, successEmbed, errorEmbed } from '../utils/embeds.js';
import { asPrivate } from '../utils/interactions.js';
import { BRAND, env } from '../config.js';
import { musicCommand, handleMusicCommand } from '../systems/music.js';

export const commands = [
  new SlashCommandBuilder().setName('profil').setDescription('Voir ton profil Syryana (XP, niveau, pièces, série)')
    .addUserOption((o) => o.setName('membre').setDescription('Voir le profil d\'un autre membre')),
  new SlashCommandBuilder().setName('quotidien').setDescription('Récupérer ta récompense quotidienne et maintenir ta série'),
  new SlashCommandBuilder().setName('classement').setDescription('Top 10 des membres les plus actifs du serveur Syryana'),
  new SlashCommandBuilder().setName('boutique').setDescription('Voir la boutique Syryana et tes pièces'),
  new SlashCommandBuilder().setName('acheter').setDescription('Acheter un objet dans la boutique')
    .addStringOption((o) => o.setName('objet').setDescription('Objet à acheter').setRequired(true).addChoices(
      { name: 'Indice quiz', value: 'quiz_hint' },
      { name: 'Boost XP 24h', value: 'xp_boost' },
      { name: 'Badge Étoile', value: 'badge_star' },
      { name: 'Ticket pseudo custom', value: 'rename_ticket' },
    )),
  new SlashCommandBuilder().setName('quiz').setDescription('Lancer le quiz du jour manuellement (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder().setName('syryana').setDescription('Infos sur le serveur et comment gagner des points'),
  new SlashCommandBuilder().setName('defi').setDescription('Mini-défi : devine le nombre (1-20) pour des points bonus'),
  new SlashCommandBuilder().setName('verifier').setDescription('Passer le questionnaire d\'entrée Syryana'),
  new SlashCommandBuilder().setName('panel-verification').setDescription('Publier le panneau de vérification (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder().setName('verification-reload').setDescription('Recharger les questions depuis le fichier JSON (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder().setName('roue').setDescription('Tourne la roue de la fortune (1x par jour)'),
  new SlashCommandBuilder().setName('duel').setDescription('Défier un membre en duel quiz rapide')
    .addUserOption((o) => o.setName('adversaire').setDescription('Qui défies-tu ?').setRequired(true)),
  new SlashCommandBuilder().setName('sondage').setDescription('Créer un sondage rapide')
    .addStringOption((o) => o.setName('question').setDescription('La question').setRequired(true))
    .addStringOption((o) => o.setName('choix').setDescription('Options séparées par | ex: Oui|Non|Peut-être').setRequired(true)),
  new SlashCommandBuilder().setName('suggestion').setDescription('Envoyer une suggestion pour améliorer le serveur')
    .addStringOption((o) => o.setName('texte').setDescription('Ta suggestion').setRequired(true)),
  new SlashCommandBuilder().setName('stats').setDescription('Statistiques du serveur et du bot Syryana'),
  new SlashCommandBuilder().setName('transfert').setDescription('Offrir des pièces à un autre membre')
    .addUserOption((o) => o.setName('membre').setDescription('Membre à qui offrir').setRequired(true))
    .addIntegerOption((o) => o.setName('montant').setDescription('Nombre de pièces').setRequired(true).setMinValue(1).setMaxValue(500)),
  new SlashCommandBuilder().setName('diagnostic').setDescription('Vérifier rôles, permissions et quiz (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder().setName('sync-verification').setDescription('Mettre Non vérifié à tous les membres pas encore validés (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder().setName('reset-verification').setDescription('Relancer la vérification (pour retester)')
    .addUserOption((o) => o.setName('membre').setDescription('Autre membre (réservé admin/staff)')),
  new SlashCommandBuilder().setName('forcer-role').setDescription('Obtenir le rôle Non vérifié (test) ou pour un autre membre (admin)')
    .addUserOption((o) => o.setName('membre').setDescription('Autre membre (admin uniquement)')),
  musicCommand,
].map((c) => c.toJSON());

const challenges = new Map();

function isStaff(interaction) {
  return interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    || interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
}

export async function handleCommand(interaction) {
  const { commandName } = interaction;

  if (commandName === 'profil') return cmdProfil(interaction);
  if (commandName === 'quotidien') return cmdQuotidien(interaction);
  if (commandName === 'classement') return cmdClassement(interaction);
  if (commandName === 'boutique') return cmdBoutique(interaction);
  if (commandName === 'acheter') return cmdAcheter(interaction);
  if (commandName === 'quiz') return cmdQuiz(interaction);
  if (commandName === 'syryana') return cmdSyryana(interaction);
  if (commandName === 'defi') return cmdDefi(interaction);
  if (commandName === 'verifier') return startVerification(interaction);
  if (commandName === 'panel-verification') return cmdPanelVerification(interaction);
  if (commandName === 'verification-reload') return cmdVerificationReload(interaction);
  if (commandName === 'roue') return cmdRoue(interaction);
  if (commandName === 'duel') return cmdDuel(interaction);
  if (commandName === 'sondage') return cmdSondage(interaction);
  if (commandName === 'suggestion') return cmdSuggestion(interaction);
  if (commandName === 'stats') return cmdStats(interaction);
  if (commandName === 'transfert') return cmdTransfert(interaction);
  if (commandName === 'diagnostic') return cmdDiagnostic(interaction);
  if (commandName === 'sync-verification') return cmdSyncVerification(interaction);
  if (commandName === 'reset-verification') return cmdResetVerification(interaction);
  if (commandName === 'forcer-role') return cmdForcerRole(interaction);
  if (commandName === 'musique') return handleMusicCommand(interaction);
}

async function cmdProfil(interaction) {
  const target = interaction.options.getUser('membre') ?? interaction.user;
  const member = await interaction.guild.members.fetch(target.id).catch(() => null);
  if (!member) return interaction.reply(asPrivate({ embeds: [errorEmbed('Membre introuvable.')] }));

  const { user, current, next, progress } = getProfile(member);
  const barLen = 12;
  const filled = Math.round(progress * barLen);
  const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

  const embed = syryanaEmbed(
    `Profil — ${target.username}`,
    [
      `**Titre :** ${current.title} (Niveau ${current.level})`,
      `**XP :** ${user.xp}${next ? ` → ${next.xp} pour niveau ${next.level}` : ' (MAX)'}`,
      `\`${bar}\` ${Math.round(progress * 100)}%`,
      `**Pièces Syryana :** 🪙 ${user.coins}`,
      `**Série quotidienne :** 🔥 ${user.streak} jour(s)`,
      `**Quiz :** ${user.quiz_wins} victoires / ${user.quiz_played} participations`,
    ].join('\n')
  ).setThumbnail(target.displayAvatarURL());

  return interaction.reply(asPrivate({ embeds: [embed] }));
}

async function cmdQuotidien(interaction) {
  const result = claimDaily(interaction.member);
  if (!result.ok) return interaction.reply(asPrivate({ embeds: [errorEmbed(result.message)] }));
  return interaction.reply(asPrivate({
    embeds: [successEmbed(
      `Récompense quotidienne : **+${result.amount} XP** !\nSérie : **${result.streak}** jours (+${result.streakBonus} bonus)\nContinue pour dominer le classement !`
    )],
  }));
}

async function cmdClassement(interaction) {
  const top = getLeaderboard(interaction.guild.id, 10);
  if (!top.length) {
    return interaction.reply(asPrivate({ embeds: [syryanaEmbed('Classement', 'Aucun participant. Sois le premier !')] }));
  }
  const lines = await Promise.all(top.map(async (row, i) => {
    const medal = ['🥇', '🥈', '🥉'][i] ?? `**#${i + 1}**`;
    const user = await interaction.client.users.fetch(row.user_id).catch(() => null);
    return `${medal} **${user?.username ?? 'Inconnu'}** — ${row.xp} XP | 🪙 ${row.coins} | 🔥 ${row.streak}`;
  }));
  return interaction.reply({ embeds: [syryanaEmbed('🏆 Classement Syryana', lines.join('\n'))] });
}

async function cmdBoutique(interaction) {
  const items = listShop();
  const { user } = getProfile(interaction.member);
  const list = items.map((i) => `**${i.name}** (\`${i.id}\`) — 🪙 ${i.cost}\n↳ ${i.description}`).join('\n\n');
  return interaction.reply(asPrivate({
    embeds: [syryanaEmbed('Boutique Syryana', `Tes pièces : **${user.coins}**\n\n${list}\n\n\`/acheter objet:\``)],
  }));
}

async function cmdAcheter(interaction) {
  const result = purchase(interaction.user.id, interaction.guild.id, interaction.options.getString('objet'));
  if (!result.ok) return interaction.reply(asPrivate({ embeds: [errorEmbed(result.message)] }));
  return interaction.reply(asPrivate({ embeds: [successEmbed(result.message)] }));
}

async function cmdQuiz(interaction) {
  if (!interaction.channel.isTextBased()) {
    return interaction.reply(asPrivate({ embeds: [errorEmbed('Salon texte requis.')] }));
  }
  await interaction.deferReply(asPrivate({}));
  await startDailyQuiz(interaction.channel);
  return interaction.editReply({ embeds: [successEmbed('Quiz du jour lancé !')] });
}

async function cmdSyryana(interaction) {
  return interaction.reply(asPrivate({
    embeds: [syryanaEmbed(`Bienvenue sur ${BRAND.name}`, [
      BRAND.tagline, '',
      '**Points & activité :**',
      '• `/quotidien` — récompense + série 🔥',
      '• `/roue` — roue de la fortune (1x/jour)',
      '• Messages & vocal — XP passif',
      '• Quiz du soir — gros gains',
      '• `/defi` `/duel` — mini-jeux',
      '',
      '**Communauté :**',
      '• `/classement` `/boutique` `/transfert`',
      '• `/sondage` `/suggestion`',
      '',
      '**VIP :**',
      '• `/musique jouer` — lecteur YouTube & liens directs (salon vocal)',
      '• `/musique passer` `arreter` `file` `en-cours`',
      '',
      'Nouveau ? Passe `/verifier` si tu n\'as pas encore accès.',
    ].join('\n'))],
  }));
}

async function cmdDefi(interaction) {
  const num = Math.floor(Math.random() * 20) + 1;
  challenges.set(interaction.user.id, { num, guildId: interaction.guild.id, tries: 0, expires: Date.now() + 120_000 });
  return interaction.reply(asPrivate({
    embeds: [syryanaEmbed(
      '🎲 Défi Syryana',
      'Nombre entre **1** et **20**. Envoie ta réponse **en message privé au bot** (MP) ou tape le nombre ici — seul toi verras mes réponses en MP.'
    )],
  }));
}

async function cmdPanelVerification(interaction) {
  const cfg = getVerificationConfig();
  if (!cfg.questions?.length) {
    return interaction.reply(asPrivate({
      embeds: [errorEmbed('Ajoute des questions dans `config/verification-questions.json` d\'abord.')],
    }));
  }
  await interaction.deferReply(asPrivate({}));
  loadVerificationConfig();
  const { refreshPinnedPanel } = await import('../systems/verification-panel.js');
  await refreshPinnedPanel(interaction.channel, interaction.client);
  return interaction.editReply({
    embeds: [successEmbed('Panneau mis à jour, épinglé, doublons supprimés. Questions rechargées.')],
  });
}

async function cmdVerificationReload(interaction) {
  const cfg = loadVerificationConfig();
  return interaction.reply(asPrivate({
    embeds: [successEmbed(`Questions rechargées : **${cfg.questions?.length ?? 0}** question(s) actives.`)],
  }));
}

async function cmdRoue(interaction) {
  const result = spinDaily(interaction.member);
  if (!result.ok) return interaction.reply(asPrivate({ embeds: [errorEmbed(result.message)] }));
  const { reward, xpGained } = result;
  let extra = '';
  if (xpGained) extra = `\n+**${xpGained}** XP`;
  if (reward.coins) extra += `\n+**${reward.coins}** pièces`;
  return interaction.reply(asPrivate({
    embeds: [syryanaEmbed('🎡 Roue Syryana', `La roue s'arrête sur… **${reward.label}** !${extra}`)],
  }));
}

async function cmdDuel(interaction) {
  const opponent = interaction.options.getMember('adversaire');
  if (!opponent) return interaction.reply(asPrivate({ embeds: [errorEmbed('Membre introuvable.')] }));
  const result = startDuel(interaction.member, opponent);
  if (!result.ok) return interaction.reply(asPrivate({ embeds: [errorEmbed(result.message)] }));
  return interaction.reply({ content: result.content, components: result.components });
}

async function cmdSondage(interaction) {
  const question = interaction.options.getString('question');
  const raw = interaction.options.getString('choix');
  const options = raw.split('|').map((s) => s.trim()).filter(Boolean);
  if (options.length < 2 || options.length > 5) {
    return interaction.reply(asPrivate({ embeds: [errorEmbed('Indique 2 à 5 choix séparés par |')] }));
  }
  const poll = buildPoll(question, options);
  return interaction.reply(poll);
}

async function cmdSuggestion(interaction) {
  const text = interaction.options.getString('texte');
  const channelId = env.suggestionsChannelId;
  if (!channelId) {
    return interaction.reply(asPrivate({ embeds: [errorEmbed('Salon suggestions non configuré (SUGGESTIONS_CHANNEL_ID).')] }));
  }
  const channel = interaction.guild.channels.cache.get(channelId);
  if (!channel?.isTextBased()) {
    return interaction.reply(asPrivate({ embeds: [errorEmbed('Salon suggestions introuvable.')] }));
  }
  await channel.send({
    embeds: [syryanaEmbed('💡 Suggestion', `**De :** ${interaction.user}\n\n${text}`)],
  });
  return interaction.reply(asPrivate({ embeds: [successEmbed('Merci ! Ta suggestion a été envoyée à l\'équipe.')] }));
}

async function cmdStats(interaction) {
  const guild = interaction.guild;
  const cfg = getVerificationConfig();
  return interaction.reply(asPrivate({
    embeds: [syryanaEmbed('📈 Stats Syryana', [
      `**Membres :** ${guild.memberCount}`,
      `**Salons :** ${guild.channels.cache.size}`,
      `**Questions vérification :** ${cfg.questions?.length ?? 0}`,
      `**Quiz en base :** actif`,
      '',
      'Bot Syryana — gamification, quiz, vérification, duels.',
    ].join('\n'))],
  }));
}

async function cmdDiagnostic(interaction) {
  const { issues, ok } = checkGuildSetup(interaction.guild);
  const lines = [
    '**OK**',
    ok.length ? ok.map((m) => `✅ ${m}`).join('\n') : '—',
    '',
    '**À corriger**',
    issues.map((m) => `⚠️ ${m}`).join('\n'),
    '',
    '**Quiz auto** : le bot doit être **allumé** à l\'heure du quiz (20h par défaut). Pas besoin d\'être admin, seulement pouvoir écrire dans #quiz.',
  ];
  return interaction.reply(asPrivate({ embeds: [syryanaEmbed('Diagnostic Syryana', lines.join('\n'))] }));
}

async function cmdForcerRole(interaction) {
  const target = interaction.options.getUser('membre') ?? interaction.user;
  if (target.id !== interaction.user.id && !isStaff(interaction)) {
    return interaction.reply(asPrivate({
      embeds: [errorEmbed('Tu ne peux utiliser cette commande que sur **toi-même**.')],
    }));
  }

  const member = await interaction.guild.members.fetch(target.id).catch(() => null);
  if (!member) {
    return interaction.reply(asPrivate({ embeds: [errorEmbed('Membre introuvable.')] }));
  }

  const result = await retryUnverifiedRole(member);
  if (!result.ok) {
    return interaction.reply(asPrivate({
      embeds: [errorEmbed(
        `Impossible d'attribuer le rôle.\n**Raison :** ${result.reason}\n→ Donne **Gérer les rôles** au bot et place **Syrbot** au-dessus de « Non vérifié ».`
      )],
    }));
  }

  return interaction.reply(asPrivate({
    embeds: [successEmbed(`Rôle **Non vérifié** attribué à **${target.username}**.`)],
  }));
}

async function cmdResetVerification(interaction) {
  const target = interaction.options.getUser('membre') ?? interaction.user;
  if (target.id !== interaction.user.id && !isStaff(interaction)) {
    return interaction.reply(asPrivate({
      embeds: [errorEmbed('Tu ne peux réinitialiser que **ta propre** vérification.')],
    }));
  }

  const member = await interaction.guild.members.fetch(target.id).catch(() => null);
  if (!member) {
    return interaction.reply(asPrivate({ embeds: [errorEmbed('Membre introuvable.')] }));
  }

  await interaction.deferReply(asPrivate({}));
  const result = await resetVerification(member);

  if (!result.ok) {
    return interaction.editReply({
      embeds: [errorEmbed(
        `Réinitialisation partielle pour **${target.username}**.\nRaison : ${result.reason ?? 'inconnue'}\nVérifie que le bot peut **Gérer les rôles** et est au-dessus de « Non vérifié ».`
      )],
    });
  }

  return interaction.editReply({
    embeds: [successEmbed(
      `**${target.username}** est de nouveau **Non vérifié**.\n→ Passe par #vérification ou \`/verifier\` pour retester.`
    )],
  });
}

async function cmdSyncVerification(interaction) {
  await interaction.deferReply(asPrivate({}));
  const { fixed, errors } = await syncUnverifiedRoles(interaction.guild);
  return interaction.editReply({
    embeds: [successEmbed(`Synchronisation terminée.\n**${fixed}** membre(s) ont reçu le rôle Non vérifié.\n**${errors}** erreur(s).`)],
  });
}

async function cmdTransfert(interaction) {
  const target = interaction.options.getUser('membre');
  const amount = interaction.options.getInteger('montant');
  if (target.id === interaction.user.id) {
    return interaction.reply(asPrivate({ embeds: [errorEmbed('Tu ne peux pas te transférer à toi-même.')] }));
  }

  const { user } = getProfile(interaction.member);
  if (user.coins < amount) {
    return interaction.reply(asPrivate({ embeds: [errorEmbed(`Tu n\'as que **${user.coins}** pièces.`)] }));
  }

  getUser(target.id, interaction.guild.id);
  db.prepare('UPDATE users SET coins = coins - ? WHERE user_id = ? AND guild_id = ?')
    .run(amount, interaction.user.id, interaction.guild.id);
  db.prepare('UPDATE users SET coins = coins + ? WHERE user_id = ? AND guild_id = ?')
    .run(amount, target.id, interaction.guild.id);

  return interaction.reply(asPrivate({
    embeds: [successEmbed(`Tu as offert **${amount}** pièces à **${target.username}** ! 🎁`)],
  }));
}

export async function handleMessageForChallenge(message) {
  const c = challenges.get(message.author.id);
  if (!c) return false;

  const guildId = message.guild?.id ?? c.guildId;
  if (c.guildId !== guildId) return false;

  if (Date.now() > c.expires) {
    challenges.delete(message.author.id);
    return false;
  }

  const guess = parseInt(message.content.trim(), 10);
  if (Number.isNaN(guess)) return false;

  let member = message.member;
  if (!member) {
    const guild = message.client.guilds.cache.get(c.guildId);
    member = await guild?.members.fetch(message.author.id).catch(() => null);
  }
  if (!member) return false;

  const dm = async (text) => {
    await message.author.send(text).catch(async () => {
      if (message.guild) await message.reply(text).catch(() => {});
    });
  };

  c.tries += 1;
  if (guess === c.num) {
    challenges.delete(message.author.id);
    const { amount } = grantXp(member, 80, 'defi');
    await dm(`🎯 **Bravo !** **${c.num}** trouvé en ${c.tries} essai(s) — +${amount} XP !`);
    return true;
  }

  if (c.tries >= 3) {
    challenges.delete(message.author.id);
    await dm(`💀 Perdu ! C'était **${c.num}**.`);
    return true;
  }

  await dm(`❌ (${c.tries}/3) ${guess < c.num ? 'Plus haut ⬆️' : 'Plus bas ⬇️'}`);
  return true;
}
