import db, { getUser, addXp } from '../db.js';
import { XP, env, getLevelFromXp } from '../config.js';

export function hasXpBoost(user) {
  if (!user.xp_boost_until) return false;
  return new Date(user.xp_boost_until) > new Date();
}

export function getMultiplier(member) {
  let m = 1;
  if (hasXpBoost(getUser(member.id, member.guild.id))) m *= 2;
  if (env.vipRoleId && member.roles.cache.has(env.vipRoleId)) m *= XP.vipMultiplier;
  return m;
}

export function grantXp(member, baseAmount, reason = '') {
  const amount = Math.floor(baseAmount * getMultiplier(member));
  addXp(member.id, member.guild.id, amount);
  return { amount, reason };
}

export function tryMessageXp(member) {
  const user = getUser(member.id, member.guild.id);
  const now = Date.now();
  if (user.last_message_xp) {
    const last = new Date(user.last_message_xp).getTime();
    if (now - last < XP.messageCooldownMs) return null;
  }
  db.prepare('UPDATE users SET last_message_xp = ? WHERE user_id = ? AND guild_id = ?')
    .run(new Date().toISOString(), member.id, member.guild.id);
  return grantXp(member, XP.message, 'message');
}

export function claimDaily(member) {
  const user = getUser(member.id, member.guild.id);
  const today = new Date().toISOString().slice(0, 10);
  if (user.last_daily === today) {
    return { ok: false, message: 'Tu as déjà récupéré ta récompense quotidienne aujourd\'hui ! Reviens demain 🔁' };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  let streak = user.streak || 0;
  if (user.last_daily === yStr) streak += 1;
  else streak = 1;

  const streakBonus = Math.min(streak * XP.streakBonusPerDay, XP.maxStreakBonus);
  const total = XP.dailyLogin + streakBonus;

  db.prepare(`
    UPDATE users SET last_daily = ?, streak = ? WHERE user_id = ? AND guild_id = ?
  `).run(today, streak, member.id, member.guild.id);

  const { amount } = grantXp(member, total, 'daily');
  return { ok: true, amount, streak, streakBonus };
}

export function getProfile(member) {
  const user = getUser(member.id, member.guild.id);
  const { current, next, progress } = getLevelFromXp(user.xp);
  return { user, current, next, progress };
}
