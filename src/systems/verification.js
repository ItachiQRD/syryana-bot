import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { syryanaEmbed, successEmbed, errorEmbed } from '../utils/embeds.js';
import { asPrivate } from '../utils/interactions.js';
import { BRAND, env } from '../config.js';
import { grantXp } from './xp.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUESTIONS_PATH = join(__dirname, '../../config/verification-questions.json');

const MAX_TRIES_PER_QUESTION = 3;

let config = { enabled: false, questions: [], title: '', description: '', welcomeBonusXp: 0 };

export function loadVerificationConfig() {
  if (!existsSync(QUESTIONS_PATH)) {
    config = { enabled: false, questions: [], title: '', description: '', welcomeBonusXp: 0 };
    return config;
  }
  const raw = readFileSync(QUESTIONS_PATH, 'utf-8');
  config = JSON.parse(raw);
  return config;
}

loadVerificationConfig();

export function getVerificationConfig() {
  return config;
}

export function isVerified(userId, guildId) {
  const row = db.prepare(
    'SELECT 1 FROM verified_members WHERE user_id = ? AND guild_id = ?'
  ).get(userId, guildId);
  return !!row;
}

function markVerified(userId, guildId) {
  db.prepare(`
    INSERT OR IGNORE INTO verified_members (user_id, guild_id) VALUES (?, ?)
  `).run(userId, guildId);
}

/** Membre déjà accepté (base ou rôle Membre) — pas soumis à la vérification */
export function isAlreadyMember(member) {
  if (!member?.guild) return false;
  if (isVerified(member.id, member.guild.id)) return true;
  if (env.memberRoleId && member.roles.cache.has(env.memberRoleId)) return true;
  return false;
}

/** Uniquement les gens avec le rôle Non vérifié qui ne sont pas encore membres */
export function isPendingVerification(member) {
  if (!env.unverifiedRoleId || !member?.guild) return false;
  if (isAlreadyMember(member)) return false;
  return member.roles.cache.has(env.unverifiedRoleId);
}

export async function applyUnverifiedRole(member) {
  if (isAlreadyMember(member)) {
    return { ok: true, skipped: 'already_member' };
  }

  if (!env.unverifiedRoleId) {
    console.warn('[verif] UNVERIFIED_ROLE_ID manquant dans .env');
    return { ok: false, reason: 'missing_unverified_role_id' };
  }

  const guild = member.guild;
  const me = guild.members.me;
  const unverified = guild.roles.cache.get(env.unverifiedRoleId);

  if (!unverified) {
    console.error('[verif] Rôle Non vérifié introuvable:', env.unverifiedRoleId);
    return { ok: false, reason: 'role_not_found' };
  }

  if (!me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    console.error('[verif] Permission « Gérer les rôles » manquante pour le bot');
    return { ok: false, reason: 'no_manage_roles' };
  }

  if (me.roles.highest.position <= unverified.position) {
    console.error('[verif] Rôle du bot trop bas — place Syrbot AU-DESSUS de « Non vérifié »');
    return { ok: false, reason: 'role_hierarchy' };
  }

  try {
    if (!member.roles.cache.has(unverified.id)) {
      await member.roles.add(unverified, 'Syryana — en attente de vérification');
    }
  } catch (err) {
    console.error('[verif] Échec ajout rôle:', err.message);
    return { ok: false, reason: err.message };
  }

  if (env.memberRoleId) {
    const memberRole = guild.roles.cache.get(env.memberRoleId);
    if (memberRole && member.roles.cache.has(memberRole.id)) {
      await member.roles.remove(memberRole, 'Syryana — pas encore vérifié').catch(() => {});
    }
  }

  return { ok: true };
}

/** Applique Non vérifié à tous les membres pas encore validés en base */
export async function syncUnverifiedRoles(guild) {
  const unverifiedId = env.unverifiedRoleId;
  if (!unverifiedId) return { fixed: 0, errors: 0 };

  let fixed = 0;
  let errors = 0;
  const members = await guild.members.fetch();

  for (const [, m] of members) {
    if (m.user.bot) continue;
    if (isAlreadyMember(m)) continue;
    if (m.roles.cache.has(unverifiedId)) continue;

    const result = await applyUnverifiedRole(m);
    if (result.ok) fixed += 1;
    else errors += 1;
  }

  return { fixed, errors, total: members.size };
}

/** Remet un membre en attente de vérification (admin / test) */
/** À appeler si le bot n'a pas pu donner le rôle à l'arrivée */
export async function retryUnverifiedRole(member) {
  return applyUnverifiedRole(member);
}

export async function resetVerification(member) {
  db.prepare('DELETE FROM verified_members WHERE user_id = ? AND guild_id = ?')
    .run(member.id, member.guild.id);
  clearSession(member.id, member.guild.id);

  if (env.memberRoleId) {
    const r = member.guild.roles.cache.get(env.memberRoleId);
    if (r && member.roles.cache.has(r.id)) {
      await member.roles.remove(r, 'Syryana — réinitialisation vérification').catch(() => {});
    }
  }

  return applyUnverifiedRole(member);
}

export async function grantMemberAccess(member) {
  if (env.unverifiedRoleId) {
    const r = member.guild.roles.cache.get(env.unverifiedRoleId);
    if (r && member.roles.cache.has(r.id)) await member.roles.remove(r).catch(() => {});
  }
  if (env.memberRoleId) {
    const r = member.guild.roles.cache.get(env.memberRoleId);
    if (r) await member.roles.add(r).catch(() => {});
  }
  markVerified(member.id, member.guild.id);
}

function normalizeText(value, caseInsensitive) {
  const v = value.trim();
  return caseInsensitive ? v.toLowerCase() : v;
}

function checkTextAnswer(question, answer) {
  const normalized = normalizeText(answer, question.caseInsensitive !== false);
  const accepted = question.answers.map((a) =>
    normalizeText(String(a), question.caseInsensitive !== false)
  );
  return accepted.includes(normalized);
}

function checkChoiceAnswer(question, choiceIndex) {
  return choiceIndex === question.correctIndex;
}

function getSession(userId, guildId) {
  const row = db.prepare(
    'SELECT step, tries FROM verification_sessions WHERE user_id = ? AND guild_id = ?'
  ).get(userId, guildId);
  if (!row) return null;
  return { step: row.step, tries: row.tries };
}

function setSession(userId, guildId, data) {
  db.prepare(`
    INSERT INTO verification_sessions (user_id, guild_id, step, tries)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id) DO UPDATE SET step = ?, tries = ?
  `).run(userId, guildId, data.step, data.tries, data.step, data.tries);
}

function clearSession(userId, guildId) {
  db.prepare('DELETE FROM verification_sessions WHERE user_id = ? AND guild_id = ?')
    .run(userId, guildId);
}

export function buildVerificationPanel() {
  const cfg = getVerificationConfig();
  const count = cfg.questions?.length ?? 0;

  const embed = syryanaEmbed(
    cfg.title || 'Vérification Syryana',
    [
      cfg.description || 'Clique **Commencer** pour entrer dans le royaume.',
      '',
      `📋 **${count}** étapes (charte incluse) — chaque réponse doit être **correcte**.`,
      `🔁 **${MAX_TRIES_PER_QUESTION}** essais par étape.`,
      '',
      '👇 **Commencer** ou `/verifier`',
    ].join('\n')
  );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify:start')
      .setLabel('Commencer la vérification')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🔐')
  );

  return { embeds: [embed], components: [row] };
}

function buildChoiceComponents(step, cfg) {
  const q = cfg.questions[step];
  const components = [];
  if (q.type === 'choice' || q.type === 'charter') {
    const row = new ActionRowBuilder();
    q.choices.forEach((label, i) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`verify:choice:${step}:${i}`)
          .setLabel(label.slice(0, 80))
          .setStyle(ButtonStyle.Secondary)
      );
    });
    components.push(row);
  } else {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`verify:text:${step}`)
          .setLabel('Répondre')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('✏️')
      )
    );
  }
  return components;
}

function buildQuestionPayload(step) {
  const cfg = getVerificationConfig();
  const q = cfg.questions[step];
  const total = cfg.questions.length;

  const lines = [
    `**Étape ${step + 1} / ${total}**`,
    '',
    q.question,
  ];
  if (q.type === 'charter' && cfg.charter) {
    lines.push('', cfg.charter);
  }
  if (q.hint) lines.push('', `💡 *${q.hint}*`);

  const title = q.type === 'charter' ? 'Charte & allégeance' : 'Vérification';
  const embed = syryanaEmbed(title, lines.join('\n').slice(0, 4000));

  return asPrivate({ embeds: [embed], components: buildChoiceComponents(step, cfg) });
}

function buildWrongAnswerPayload(step, tries) {
  const cfg = getVerificationConfig();
  const q = cfg.questions[step];
  const total = cfg.questions.length;
  const remaining = MAX_TRIES_PER_QUESTION - tries;
  const wrongText = q?.wrongMessage ?? 'Ce n\'est pas la bonne réponse.';

  const lines = [
    '## ❌ Mauvaise réponse',
    '',
    wrongText,
    '',
    `**Essais :** ${tries} / ${MAX_TRIES_PER_QUESTION} — il te reste **${remaining}** essai(s).`,
    '',
    '─'.repeat(12),
    '',
    `**Étape ${step + 1} / ${total}**`,
    '',
    q.question,
  ];
  if (q.type === 'charter' && cfg.charter) {
    lines.push('', cfg.charter);
  }
  lines.push('', '👇 **Choisis une autre réponse :**');

  const embed = syryanaEmbed('Oups…', lines.join('\n').slice(0, 4000));
  return asPrivate({ embeds: [embed], components: buildChoiceComponents(step, cfg) });
}

function buildRestartPayload() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify:start')
      .setLabel('Recommencer')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🔐')
  );
  return asPrivate({
    embeds: [errorEmbed('Trop d\'erreurs. Tu dois recommencer la vérification depuis le début.')],
    components: [row],
  });
}

async function replyWithQuestion(interaction, step) {
  const payload = buildQuestionPayload(step);

  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload);
  }
  if (interaction.isButton() || interaction.isModalSubmit()) {
    return interaction.update(payload).catch(() => interaction.editReply(payload));
  }
  return interaction.reply(payload);
}

export async function startVerification(interaction) {
  const cfg = getVerificationConfig();
  if (!cfg.enabled || !cfg.questions?.length) {
    return interaction.reply(asPrivate({
      embeds: [errorEmbed('La vérification n\'est pas configurée. Vérifie `config/verification-questions.json`.')],
    }));
  }

  const member = interaction.member;
  if (isAlreadyMember(member)) {
    return interaction.reply(asPrivate({
      embeds: [successEmbed('Tu es déjà membre du royaume — pas besoin de repasser la vérification.')],
    }));
  }

  if (env.memberRoleId && member.roles.cache.has(env.memberRoleId) && !env.unverifiedRoleId) {
    markVerified(member.id, member.guild.id);
    return interaction.reply(asPrivate({
      embeds: [successEmbed('Tu as déjà accès au serveur.')],
    }));
  }

  clearSession(member.id, member.guild.id);
  setSession(member.id, member.guild.id, { step: 0, tries: 0 });
  await interaction.deferReply(asPrivate({}));
  await replyWithQuestion(interaction, 0);
}

async function onWrongAnswer(interaction) {
  const cfg = getVerificationConfig();
  const session = getSession(interaction.user.id, interaction.guild.id);
  if (!session) {
    return interaction.reply(asPrivate({
      embeds: [errorEmbed('Session perdue. Clique **Commencer** ou `/verifier`.')],
    })).catch(() => {});
  }

  const q = cfg.questions[session.step];
  const tries = session.tries + 1;

  if (tries >= MAX_TRIES_PER_QUESTION) {
    clearSession(interaction.user.id, interaction.guild.id);
    const payload = buildRestartPayload();
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply(payload);
    }
    return interaction.update(payload).catch(() => interaction.editReply(payload));
  }

  setSession(interaction.user.id, interaction.guild.id, { step: session.step, tries });
  const payload = buildWrongAnswerPayload(session.step, tries);

  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload);
  }
  return interaction.update(payload).catch(() => interaction.editReply(payload));
}

async function onCorrectAnswer(interaction) {
  const cfg = getVerificationConfig();
  const session = getSession(interaction.user.id, interaction.guild.id);
  if (!session) return startVerification(interaction);

  const nextStep = session.step + 1;
  if (nextStep >= cfg.questions.length) {
    clearSession(interaction.user.id, interaction.guild.id);
    await grantMemberAccess(interaction.member);

    const bonus = cfg.welcomeBonusXp ?? 75;
    if (bonus > 0) grantXp(interaction.member, bonus, 'verification');

    const welcomeChannel = env.welcomeChannelId
      ? interaction.guild.channels.cache.get(env.welcomeChannelId)
      : null;

    if (welcomeChannel?.isTextBased()) {
      await welcomeChannel.send({
        content: `${interaction.member} ${BRAND.emoji}`,
        embeds: [syryanaEmbed(
          'Accès débloqué !',
          [
            `Bienvenue officiellement, **${interaction.user.username}** !`,
            '',
            `+**${bonus}** XP de bienvenue`,
            '• `/syryana` — guide du serveur',
            '• `/quotidien` — récompense chaque jour',
            '• Participe au quiz du soir !',
          ].join('\n')
        )],
      }).catch(() => {});
    }

    const reply = successEmbed(
      `**Félicitations !** Tu as juré allégeance à Sa Majesté **Syryana** et accèdes au royaume.\n+${bonus} XP de bienvenue. Longue vie à la reine ! 👑`
    );

    if (interaction.isModalSubmit() || interaction.isButton()) {
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply({ embeds: [reply], components: [] });
      }
      return interaction.reply(asPrivate({ embeds: [reply] }));
    }
    return interaction.reply(asPrivate({ embeds: [reply] }));
  }

  setSession(interaction.user.id, interaction.guild.id, { step: nextStep, tries: 0 });
  await replyWithQuestion(interaction, nextStep);
}

export async function handleVerificationButton(interaction) {
  const { customId } = interaction;

  if (customId === 'verify:start') {
    return startVerification(interaction);
  }

  if (customId.startsWith('verify:text:')) {
    const step = Number(customId.split(':')[2]);
    const cfg = getVerificationConfig();
    const q = cfg.questions[step];
    if (!q || q.type !== 'text') {
      return interaction.reply(asPrivate({ embeds: [errorEmbed('Question invalide.')] }));
    }

    const modal = new ModalBuilder()
      .setCustomId(`verify:modal:${step}`)
      .setTitle(`Question ${step + 1}`);

    const input = new TextInputBuilder()
      .setCustomId('answer')
      .setLabel('Ta réponse')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(200)
      .setPlaceholder(q.hint ?? 'Réponse exacte requise');

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  if (customId.startsWith('verify:choice:')) {
    const parts = customId.split(':');
    const buttonStep = Number(parts[2]);
    const choiceIndex = Number(parts[3]);
    const session = getSession(interaction.user.id, interaction.guild.id);
    const cfg = getVerificationConfig();

    if (!session) {
      return interaction.reply(asPrivate({
        embeds: [errorEmbed('Aucune session active. Clique **Commencer** ou `/verifier`.')],
      }));
    }

    if (session.step !== buttonStep) {
      return interaction.reply(asPrivate({
        embeds: [errorEmbed('Ce message est périmé. Clique **Commencer** ou `/verifier` pour reprendre.')],
      }));
    }

    const q = cfg.questions[session.step];
    if (!q) {
      return interaction.reply(asPrivate({ embeds: [errorEmbed('Question introuvable.')] }));
    }

    if (!checkChoiceAnswer(q, choiceIndex)) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate().catch(() => {});
      }
      return onWrongAnswer(interaction);
    }

    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate().catch(() => {});
    }
    return onCorrectAnswer(interaction);
  }
}

export async function handleVerificationModal(interaction) {
  if (!interaction.customId.startsWith('verify:modal:')) return false;

  const step = Number(interaction.customId.split(':')[2]);
  const cfg = getVerificationConfig();
  const q = cfg.questions[step];
  const session = getSession(interaction.user.id, interaction.guild.id);
  const answer = interaction.fields.getTextInputValue('answer');

  if (!session || session.step !== step) {
    await interaction.reply(asPrivate({
      embeds: [errorEmbed('Session expirée. Relance avec `/verifier`.')],
    }));
    return true;
  }

  if (!checkTextAnswer(q, answer)) {
    await interaction.deferReply(asPrivate({}));
    await onWrongAnswer(interaction);
    return true;
  }

  await interaction.deferReply(asPrivate({}));
  await onCorrectAnswer(interaction);
  return true;
}

export const ALLOWED_WHILE_UNVERIFIED = new Set(['verifier', 'syryana']);
