import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { BRAND } from '../config.js';
import { errorEmbed } from '../utils/embeds.js';
import { asPrivate } from '../utils/interactions.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUESTIONS_PATH = join(__dirname, '../../config/sassou-questions.json');

let config = { title: 'Quiz Sassou', footer: '', questions: [] };

export function loadSassouConfig() {
  if (!existsSync(QUESTIONS_PATH)) {
    console.warn('[sassou] Fichier manquant:', QUESTIONS_PATH);
    config = { title: 'Quiz Sassou', footer: '', questions: [] };
    return config;
  }
  try {
    config = JSON.parse(readFileSync(QUESTIONS_PATH, 'utf-8'));
    if (!Array.isArray(config.questions)) config.questions = [];
    console.log(`[sassou] ${config.questions.length} question(s) chargée(s)`);
  } catch (e) {
    console.error('[sassou] JSON invalide:', e.message);
  }
  return config;
}

loadSassouConfig();

export function getSassouConfig() {
  return config;
}

function pickQuestion(index) {
  const list = config.questions;
  if (!list.length) return null;
  if (index !== undefined && index >= 0 && index < list.length) {
    return list[index];
  }
  return list[Math.floor(Math.random() * list.length)];
}

function buildSassouButtons(question) {
  const row = new ActionRowBuilder();
  const labels = ['A', 'B', 'C', 'D'];
  question.choices.slice(0, 4).forEach((choice, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`sassou:${question.id}:${i}`)
        .setLabel(`${labels[i]}) ${choice.label.slice(0, 70)}`)
        .setStyle(ButtonStyle.Secondary),
    );
  });
  return [row];
}

function sassouEmbed(question) {
  const lines = question.choices.map((c, i) => {
    const letter = ['A', 'B', 'C', 'D'][i];
    return `**${letter}.** ${c.label}`;
  });

  return new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle(`🎭 ${config.title ?? 'Quiz Sassou'}`)
    .setDescription([
      `**${question.question}**`,
      '',
      ...lines,
      '',
      config.footer || '_Clique un bouton pour voir la chute !_',
    ].join('\n'))
    .setFooter({ text: BRAND.footer })
    .setTimestamp();
}

export const sassouCommand = new SlashCommandBuilder()
  .setName('sassou')
  .setDescription('Lancer une question du questionnaire comique Papa Sassou')
  .addIntegerOption((o) => o
    .setName('numero')
    .setDescription('Numéro de question (1, 2, 3…) — vide = aléatoire')
    .setMinValue(1));

export async function handleSassouCommand(interaction) {
  const cfg = getSassouConfig();
  if (!cfg.questions?.length) {
    return interaction.reply(asPrivate({
      embeds: [errorEmbed('Aucune question. Édite `config/sassou-questions.json` puis `/sassou-reload`.')],
    }));
  }

  const num = interaction.options.getInteger('numero');
  const index = num ? num - 1 : undefined;
  const question = pickQuestion(index);

  if (!question) {
    return interaction.reply(asPrivate({
      embeds: [errorEmbed(`Question #${num} introuvable. Il y en a **${cfg.questions.length}**.`)],
    });
  }

  if (!question.choices?.length) {
    return interaction.reply(asPrivate({
      embeds: [errorEmbed('Cette question n\'a pas de choix dans le JSON.')],
    });
  }

  await interaction.reply({
    embeds: [sassouEmbed(question)],
    components: buildSassouButtons(question),
  });
}

export const sassouReloadCommand = new SlashCommandBuilder()
  .setName('sassou-reload')
  .setDescription('Recharger les questions Sassou depuis le fichier JSON (admin)');

export async function handleSassouReload(interaction) {
  const cfg = loadSassouConfig();
  return interaction.reply(asPrivate({
    content: `✅ **${cfg.questions.length}** question(s) Sassou rechargée(s) depuis \`config/sassou-questions.json\`.`,
  });
}

export async function handleSassouButton(interaction) {
  const parts = interaction.customId.split(':');
  if (parts.length < 3) return false;

  const questionId = parts[1];
  const choiceIdx = Number(parts[2]);
  const question = config.questions.find((q) => q.id === questionId);
  if (!question) {
    await interaction.reply(asPrivate({ content: 'Question expirée. Relance `/sassou`.' }));
    return true;
  }

  const choice = question.choices[choiceIdx];
  if (!choice) {
    await interaction.reply(asPrivate({ content: 'Choix invalide.' }));
    return true;
  }

  const punchline = choice.response ?? 'Pas de chute configurée pour ce choix.';
  await interaction.reply(asPrivate({
    embeds: [
      new EmbedBuilder()
        .setColor(0xe67e22)
        .setTitle('🎭 Chute Sassou')
        .setDescription([
          `**${question.question}**`,
          '',
          `Tu as choisi : **${choice.label}**`,
          '',
          punchline,
        ].join('\n'))
        .setFooter({ text: 'Humour Syryana — à personnaliser dans le JSON' }),
    ],
  }));
  return true;
}
