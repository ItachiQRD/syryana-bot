import { EmbedBuilder } from 'discord.js';
import { BRAND } from '../config.js';

export function syryanaEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(BRAND.color)
    .setTitle(`${BRAND.emoji} ${title}`)
    .setDescription(description)
    .setFooter({ text: BRAND.footer })
    .setTimestamp();
}

export function successEmbed(msg) {
  return syryanaEmbed('Succès', msg);
}

export function errorEmbed(msg) {
  return new EmbedBuilder()
    .setColor(BRAND.accent)
    .setTitle('❌ Erreur')
    .setDescription(msg)
    .setFooter({ text: BRAND.footer });
}
