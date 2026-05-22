import db, { getUser } from '../db.js';
import { grantXp } from './xp.js';

const REWARDS = [
  { label: '10 XP', weight: 30, xp: 10, coins: 0 },
  { label: '25 XP', weight: 25, xp: 25, coins: 0 },
  { label: '50 XP', weight: 15, xp: 50, coins: 0 },
  { label: '15 pièces', weight: 15, xp: 0, coins: 15 },
  { label: '30 pièces', weight: 8, xp: 0, coins: 30 },
  { label: '100 XP JACKPOT', weight: 5, xp: 100, coins: 0 },
  { label: 'Rien… 😅', weight: 2, xp: 0, coins: 0 },
];

function pickReward() {
  const total = REWARDS.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of REWARDS) {
    roll -= r.weight;
    if (roll <= 0) return r;
  }
  return REWARDS[0];
}

export function spinDaily(member) {
  const today = new Date().toISOString().slice(0, 10);
  getUser(member.id, member.guild.id);

  const row = db.prepare('SELECT last_spin FROM users WHERE user_id = ? AND guild_id = ?')
    .get(member.id, member.guild.id);

  if (row?.last_spin === today) {
    return { ok: false, message: 'Tu as déjà tourné la roue aujourd\'hui ! Reviens demain 🎡' };
  }

  const reward = pickReward();
  db.prepare('UPDATE users SET last_spin = ? WHERE user_id = ? AND guild_id = ?')
    .run(today, member.id, member.guild.id);

  let xpGained = 0;
  if (reward.xp > 0) {
    const { amount } = grantXp(member, reward.xp, 'spin');
    xpGained = amount;
  }
  if (reward.coins > 0) {
    db.prepare('UPDATE users SET coins = coins + ? WHERE user_id = ? AND guild_id = ?')
      .run(reward.coins, member.id, member.guild.id);
  }

  return { ok: true, reward, xpGained };
}
