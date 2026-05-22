import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { asPrivate } from '../utils/interactions.js';

export function buildPoll(question, options) {
  const row = new ActionRowBuilder();
  options.slice(0, 5).forEach((opt, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`poll:${i}`)
        .setLabel(opt.slice(0, 80))
        .setStyle(ButtonStyle.Secondary)
    );
  });

  return {
    content: `📊 **Sondage Syryana**\n\n**${question}**\n\n*Clique pour voter (1 vote par personne)*`,
    components: [row],
  };
}

const pollVotes = new Map();

export async function handlePollVote(interaction) {
  const messageId = interaction.message.id;
  const option = Number(interaction.customId.split(':')[1]);

  if (!pollVotes.has(messageId)) {
    pollVotes.set(messageId, new Map());
  }
  const votes = pollVotes.get(messageId);

  if (votes.has(interaction.user.id)) {
    return interaction.reply(asPrivate({ content: 'Tu as déjà voté !' }));
  }

  votes.set(interaction.user.id, option);
  const counts = {};
  for (const v of votes.values()) {
    counts[v] = (counts[v] ?? 0) + 1;
  }

  const labels = interaction.message.components[0].components.map((c) => c.label);
  const summary = labels.map((l, i) => `**${l}** — ${counts[i] ?? 0} vote(s)`).join('\n');

  await interaction.reply(asPrivate({ content: `Vote enregistré !\n\n${summary}` }));
}
