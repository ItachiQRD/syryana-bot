import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildVerificationPanel } from './verification.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../data');
const PANEL_FILE = join(dataDir, 'verification-panel.json');

mkdirSync(dataDir, { recursive: true });

function loadPanelMeta() {
  if (!existsSync(PANEL_FILE)) return null;
  try {
    return JSON.parse(readFileSync(PANEL_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function savePanelMeta(channelId, messageId, guildId) {
  writeFileSync(PANEL_FILE, JSON.stringify({ channelId, messageId, guildId }, null, 2));
}

function hasStartButton(message) {
  return message.components?.some((row) =>
    row.components?.some((c) => c.customId === 'verify:start')
  );
}

/** Un seul panneau épinglé avec bouton dans #vérification */
export async function ensurePinnedPanel(channel, client) {
  const meta = loadPanelMeta();

  if (meta?.channelId === channel.id && meta.messageId) {
    const existing = await channel.messages.fetch(meta.messageId).catch(() => null);
    if (existing && hasStartButton(existing)) {
      if (!existing.pinned) await existing.pin().catch(() => {});
      return existing;
    }
  }

  const recent = await channel.messages.fetch({ limit: 15 }).catch(() => null);
  if (recent) {
    for (const msg of recent.values()) {
      if (msg.author.id !== client.user.id) continue;
      if (hasStartButton(msg)) {
        savePanelMeta(channel.id, msg.id, channel.guildId);
        if (!msg.pinned) await msg.pin().catch(() => {});
        return msg;
      }
    }
  }

  const panel = buildVerificationPanel();
  const sent = await channel.send(panel);
  await sent.pin().catch(() => {});
  savePanelMeta(channel.id, sent.id, channel.guildId);
  return sent;
}

/** Supprime les doublons (panneaux + anciens messages d'accueil du bot) */
export async function cleanupDuplicatePanels(channel, client, keepMessageId) {
  const recent = await channel.messages.fetch({ limit: 40 }).catch(() => null);
  if (!recent) return;

  let removed = 0;
  for (const msg of recent.values()) {
    if (msg.author.id !== client.user.id) continue;
    if (msg.id === keepMessageId) continue;

    const isOldPanel = hasStartButton(msg);
    const isOldWelcome = msg.embeds.some((e) =>
      e.title?.includes('Bienvenue') || e.title?.includes('Porte d\'entrée')
    );
    const isDuplicatePing = msg.content?.includes('message **épinglé**') && !hasStartButton(msg);

    if (isOldPanel || isOldWelcome || isDuplicatePing) {
      await msg.delete().catch(() => {});
      removed += 1;
    }
  }
  if (removed > 0) console.log(`[verif] ${removed} message(s) en double supprimé(s)`);
}

/** Met à jour le panneau épinglé sans reposter (évite les notifs à chaque redémarrage) */
export async function refreshPinnedPanel(channel, client) {
  const panel = buildVerificationPanel();
  const meta = loadPanelMeta();

  if (meta?.channelId === channel.id && meta.messageId) {
    const existing = await channel.messages.fetch(meta.messageId).catch(() => null);
    if (existing && hasStartButton(existing)) {
      await existing.edit(panel);
      if (!existing.pinned) await existing.pin().catch(() => {});
      await cleanupDuplicatePanels(channel, client, existing.id);
      return existing;
    }
  }

  const ensured = await ensurePinnedPanel(channel, client);
  await cleanupDuplicatePanels(channel, client, ensured.id);
  return ensured;
}
