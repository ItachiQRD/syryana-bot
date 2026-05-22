import { MessageFlags } from 'discord.js';

/** Réponse visible uniquement par l'utilisateur qui a lancé la commande */
export const PRIVATE = { flags: MessageFlags.Ephemeral };

export function asPrivate(options) {
  return { ...options, flags: (options.flags ?? 0) | MessageFlags.Ephemeral };
}
