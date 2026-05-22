import { MessageFlags } from 'discord.js';

/** Réduit les notifications push Discord (quiz, rappels, panneaux). */
export const SILENT = MessageFlags.SuppressNotifications;

export function silentPayload(payload) {
  return { ...payload, flags: (payload.flags ?? 0) | SILENT };
}
