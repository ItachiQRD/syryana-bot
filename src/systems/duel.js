import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { asPrivate } from '../utils/interactions.js';
import { getRandomQuestion } from '../db.js';
import { grantXp } from './xp.js';

const duels = new Map();

export function startDuel(challenger, opponent) {
  if (challenger.id === opponent.id) {
    return { ok: false, message: 'Tu ne peux pas te défier toi-même !' };
  }
  if (opponent.user.bot) {
    return { ok: false, message: 'Tu ne peux pas défier un bot.' };
  }

  const question = getRandomQuestion();
  if (!question) {
    return { ok: false, message: 'Pas de question disponible pour le duel.' };
  }

  const duelId = `d${Date.now().toString(36)}`;
  const choices = JSON.parse(question.choices);

  duels.set(duelId, {
    challengerId: challenger.id,
    opponentId: opponent.id,
    question,
    choices,
    scores: { [challenger.id]: null, [opponent.id]: null },
    endsAt: Date.now() + 60_000,
  });

  setTimeout(() => duels.delete(duelId), 65_000);

  const row = new ActionRowBuilder();
  choices.forEach((label, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`duel:${duelId}:${i}`)
        .setLabel(`${['A', 'B', 'C', 'D'][i]}) ${label.slice(0, 70)}`)
        .setStyle(ButtonStyle.Danger)
    );
  });

  return {
    ok: true,
    duelId,
    content: `⚔️ **Duel Syryana** — ${challenger} vs ${opponent}\n\n**${question.question}**\n*60 secondes — premier à répondre gagne des points !*`,
    components: [row],
  };
}

export async function handleDuelAnswer(interaction) {
  const [, duelId, choiceStr] = interaction.customId.split(':');
  const choice = Number(choiceStr);

  const duel = duels.get(duelId);
  if (!duel) {
    return interaction.reply(asPrivate({ content: 'Ce duel est terminé.' }));
  }

  if (Date.now() > duel.endsAt) {
    duels.delete(duelId);
    return interaction.reply(asPrivate({ content: 'Temps écoulé !' }));
  }

  const userId = interaction.user.id;
  if (userId !== duel.challengerId && userId !== duel.opponentId) {
    return interaction.reply(asPrivate({ content: 'Tu ne participes pas à ce duel.' }));
  }

  if (duel.scores[userId] !== null) {
    return interaction.reply(asPrivate({ content: 'Tu as déjà répondu.' }));
  }

  const correct = choice === duel.question.correct_index;
  duel.scores[userId] = correct;

  const bothAnswered = Object.values(duel.scores).every((v) => v !== null);

  if (correct) {
    grantXp(interaction.member, 60, 'duel-win');
  } else {
    grantXp(interaction.member, 15, 'duel-lose');
  }

  await interaction.reply(asPrivate({
    content: correct ? '✅ Bonne réponse ! (+60 XP si victoire)' : '❌ Raté (+15 XP participation)',
  }));

  if (bothAnswered) {
    const cWin = duel.scores[duel.challengerId];
    const oWin = duel.scores[duel.opponentId];
    let result;
    if (cWin && !oWin) result = `<@${duel.challengerId}> remporte le duel !`;
    else if (oWin && !cWin) result = `<@${duel.opponentId}> remporte le duel !`;
    else if (cWin && oWin) result = 'Égalité parfaite — vous êtes tous les deux des génies !';
    else result = 'Personne n\'a trouvé… revanche ?';

    await interaction.message.edit({
      content: `🏁 Duel terminé — ${result}`,
      components: [],
    });
    duels.delete(duelId);
  }
}
