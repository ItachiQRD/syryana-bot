import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import db, { getUser, addXp, getRandomQuestion, markQuestionUsed } from '../db.js';
import { XP, BRAND } from '../config.js';
import { syryanaEmbed } from '../utils/embeds.js';
import { asPrivate } from '../utils/interactions.js';

const QUIZ_DURATION_MS = 5 * 60 * 1000;
const activeSessions = new Map();

export function buildQuizButtons(choices, questionId) {
  const labels = ['A', 'B', 'C', 'D'];
  const row = new ActionRowBuilder();
  choices.forEach((choice, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz:${questionId}:${i}`)
        .setLabel(`${labels[i]}) ${choice.slice(0, 70)}`)
        .setStyle(ButtonStyle.Primary)
    );
  });
  return [row];
}

export async function startDailyQuiz(channel) {
  const question = getRandomQuestion();
  if (!question) {
    return channel.send({
      embeds: [syryanaEmbed('Quiz Syryana', '⚠️ Plus de questions en stock ! Un admin doit lancer `npm run seed-quiz`.')],
    });
  }

  const choices = JSON.parse(question.choices);
  const endsAt = new Date(Date.now() + QUIZ_DURATION_MS);

  const embed = syryanaEmbed(
    '🧠 Quiz du jour — Syryana',
    [
      `**${question.question}**`,
      '',
      choices.map((c, i) => `**${['A', 'B', 'C', 'D'][i]}.** ${c}`).join('\n'),
      '',
      `⏱️ Tu as **5 minutes** — Premiers bons réponses = plus de points !`,
      `🏷️ Catégorie : *${question.category}*`,
    ].join('\n')
  );

  const msg = await channel.send({
    content: `@here Nouveau défi Syryana ! ${BRAND.emoji}`,
    embeds: [embed],
    components: buildQuizButtons(choices, question.id),
  });

  markQuestionUsed(question.id);
  db.prepare(`
    INSERT OR REPLACE INTO active_quiz (guild_id, message_id, question_id, ends_at)
    VALUES (?, ?, ?, ?)
  `).run(channel.guild.id, msg.id, question.id, endsAt.toISOString());

  activeSessions.set(msg.id, {
    questionId: question.id,
    correctIndex: question.correct_index,
    choices,
    answered: new Set(),
    winners: [],
    endsAt,
  });

  setTimeout(() => endQuiz(channel, msg.id), QUIZ_DURATION_MS);
  return msg;
}

export async function handleQuizAnswer(interaction) {
  const [, questionIdStr, choiceStr] = interaction.customId.split(':');
  const questionId = Number(questionIdStr);
  const choice = Number(choiceStr);
  const session = activeSessions.get(interaction.message.id);

  if (!session || session.questionId !== questionId) {
    return interaction.reply(asPrivate({ content: 'Ce quiz est terminé ou invalide.' }));
  }

  if (new Date() > session.endsAt) {
    return interaction.reply(asPrivate({ content: '⏱️ Temps écoulé !' }));
  }

  if (session.answered.has(interaction.user.id)) {
    return interaction.reply(asPrivate({ content: 'Tu as déjà répondu à ce quiz !' }));
  }

  session.answered.add(interaction.user.id);
  const member = interaction.member;
  getUser(interaction.user.id, interaction.guild.id);
  db.prepare('UPDATE users SET quiz_played = quiz_played + 1 WHERE user_id = ? AND guild_id = ?')
    .run(interaction.user.id, interaction.guild.id);

  const isCorrect = choice === session.correctIndex;

  if (isCorrect) {
    const rank = session.winners.length;
    const bonus = Math.max(0, 50 - rank * 10);
    const xpGain = XP.quizCorrect + bonus;
    addXp(interaction.user.id, interaction.guild.id, xpGain);
    db.prepare('UPDATE users SET quiz_wins = quiz_wins + 1 WHERE user_id = ? AND guild_id = ?')
      .run(interaction.user.id, interaction.guild.id);

    session.winners.push({ id: interaction.user.id, xp: xpGain, rank: rank + 1 });

    db.prepare(`
      INSERT INTO quiz_history (guild_id, question_id, winner_id) VALUES (?, ?, ?)
    `).run(interaction.guild.id, questionId, interaction.user.id);

    await interaction.reply(asPrivate({
      content: `✅ **Bonne réponse !** +${xpGain} XP (place #${rank + 1}) — Bravo champion Syryana !`,
    }));
  } else {
    addXp(interaction.user.id, interaction.guild.id, XP.quizParticipation);
    await interaction.reply(asPrivate({
      content: `❌ Mauvaise réponse… +${XP.quizParticipation} XP de participation. Tu feras mieux demain !`,
    }));
  }
}

async function endQuiz(channel, messageId) {
  const session = activeSessions.get(messageId);
  if (!session) return;

  try {
    const msg = await channel.messages.fetch(messageId);
    const winnersText = session.winners.length
      ? session.winners.map((w, i) => `<@${w.id}> — +${w.xp} XP`).join('\n')
      : 'Personne n\'a trouvé la bonne réponse cette fois…';

    const embed = syryanaEmbed(
      '🏁 Quiz terminé',
      [
        `**Bonne réponse :** ${['A', 'B', 'C', 'D'][session.correctIndex]}. ${session.choices[session.correctIndex]}`,
        '',
        '**Podium :**',
        winnersText,
        '',
        `👥 Participants : ${session.answered.size}`,
      ].join('\n')
    );

    await msg.edit({ components: [], embeds: [embed] });
  } catch {
    /* message deleted */
  }

  activeSessions.delete(messageId);
  db.prepare('DELETE FROM active_quiz WHERE message_id = ?').run(messageId);
}
