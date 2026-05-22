import { handleCommand } from '../commands/index.js';
import { handleQuizAnswer } from '../systems/quiz.js';
import { handleDuelAnswer } from '../systems/duel.js';
import { handlePollVote } from '../systems/poll.js';
import {
  handleVerificationButton,
  handleVerificationModal,
  isPendingVerification,
  ALLOWED_WHILE_UNVERIFIED,
} from '../systems/verification.js';
import { errorEmbed } from '../utils/embeds.js';
import { asPrivate } from '../utils/interactions.js';

function blockIfUnverified(interaction, allowVerifyFlow = false) {
  if (!interaction.inGuild() || !isPendingVerification(interaction.member)) return false;
  if (allowVerifyFlow && interaction.customId?.startsWith('verify:')) return false;
  const payload = asPrivate({
    embeds: [errorEmbed(
      'Tu dois d\'abord passer la vérification.\n→ **Commencer** dans #vérification ou `/verifier`.'
    )],
  });
  if (interaction.replied || interaction.deferred) {
    interaction.followUp(payload).catch(() => {});
  } else {
    interaction.reply(payload).catch(() => {});
  }
  return true;
}

export async function onInteractionCreate(interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      if (
        isPendingVerification(interaction.member) &&
        !ALLOWED_WHILE_UNVERIFIED.has(interaction.commandName)
      ) {
        return interaction.reply(asPrivate({
          embeds: [errorEmbed(
            'Tu dois d\'abord passer la vérification.\n→ **Commencer** dans #vérification ou `/verifier`.'
          )],
        }));
      }
      await handleCommand(interaction);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith('verify:')) {
        await handleVerificationButton(interaction);
        return;
      }
      if (blockIfUnverified(interaction)) return;
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

    if (interaction.isModalSubmit()) {
      await handleVerificationModal(interaction);
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
