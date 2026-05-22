import db, { getUser } from '../db.js';
import { SHOP_ITEMS } from '../config.js';

export function listShop() {
  return SHOP_ITEMS;
}

export function purchase(userId, guildId, itemId) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { ok: false, message: 'Article introuvable.' };

  const user = getUser(userId, guildId);
  if (user.coins < item.cost) {
    return { ok: false, message: `Il te faut **${item.cost}** pièces Syryana (tu en as ${user.coins}).` };
  }

  db.prepare('UPDATE users SET coins = coins - ? WHERE user_id = ? AND guild_id = ?')
    .run(item.cost, userId, guildId);

  if (itemId === 'quiz_hint') {
    db.prepare('UPDATE users SET quiz_hint = quiz_hint + 1 WHERE user_id = ? AND guild_id = ?')
      .run(userId, guildId);
  }
  if (itemId === 'xp_boost') {
    const until = new Date();
    until.setHours(until.getHours() + 24);
    db.prepare('UPDATE users SET xp_boost_until = ? WHERE user_id = ? AND guild_id = ?')
      .run(until.toISOString(), userId, guildId);
  }

  db.prepare('INSERT INTO shop_purchases (user_id, item_id, cost) VALUES (?, ?, ?)')
    .run(userId, itemId, item.cost);

  return { ok: true, item, message: `Tu as acheté **${item.name}** pour ${item.cost} pièces !` };
}
