import { handleCommand } from '../commands/index.js';
import { handleQuizAnswer } from '../systems/quiz.js';
import { handleDuelAnswer } from '../systems/duel.js';
import { handlePollVote } from '../systems/poll.js';
import { errorEmbed } from '../utils/embeds.js';
import { asPrivate } from '../utils/interactions.js';

export async function onInteractionCreate(interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith('quiz:')) {
        await handleQuizAnswer(interaction);
        return;
      }
      if (interaction.customId.startsWith('duel:')) {
        await handleDuelAnswer(interaction);
        return;
      }
      if (interaction.customId.startsWith('poll:')) {
        await handlePollVote(interaction);
        return;
      }
    }
  } catch (err) {
    console.error('Interaction error:', err);
    const payload = asPrivate({ embeds: [errorEmbed('Une erreur est survenue.')] });
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
}
