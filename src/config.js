import 'dotenv/config';

export const BRAND = {
  name: 'Syryana',
  tagline: 'Bienvenue dans l\'univers Syryana ✨',
  color: 0x9b59b6,
  accent: 0xe74c3c,
  emoji: '🌟',
  footer: 'Serveur officiel Syryana — Reste actif, grimpe au classement !',
};

export const XP = {
  message: 8,
  messageCooldownMs: 60_000,
  dailyLogin: 50,
  quizCorrect: 100,
  quizParticipation: 25,
  voiceMinute: 3,
  streakBonusPerDay: 10,
  maxStreakBonus: 70,
  vipMultiplier: 1.5,
};

export const LEVELS = [
  { level: 1, xp: 0, title: 'Novice Syryana' },
  { level: 2, xp: 200, title: 'Explorateur' },
  { level: 3, xp: 500, title: 'Aventurier' },
  { level: 4, xp: 1000, title: 'Guerrier' },
  { level: 5, xp: 2000, title: 'Champion' },
  { level: 6, xp: 4000, title: 'Héros Syryana' },
  { level: 7, xp: 7000, title: 'Légende' },
  { level: 8, xp: 12000, title: 'Immortel Syryana' },
];

export const SHOP_ITEMS = [
  { id: 'badge_star', name: 'Badge Étoile Syryana', cost: 500, description: 'Rôle cosmétique Étoile (à configurer)' },
  { id: 'quiz_hint', name: 'Indice quiz', cost: 150, description: 'Révèle une lettre de la bonne réponse au prochain quiz' },
  { id: 'xp_boost', name: 'Boost XP 24h', cost: 300, description: 'x2 XP pendant 24 heures' },
  { id: 'rename_ticket', name: 'Ticket pseudo custom', cost: 800, description: 'Demande un surnom custom (modération)' },
];

export const env = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  quizChannelId: process.env.QUIZ_CHANNEL_ID,
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID,
  leaderboardChannelId: process.env.LEADERBOARD_CHANNEL_ID,
  suggestionsChannelId: process.env.SUGGESTIONS_CHANNEL_ID,
  vipRoleId: process.env.VIP_ROLE_ID,
  unverifiedRoleId: process.env.UNVERIFIED_ROLE_ID,
  memberRoleId: process.env.MEMBER_ROLE_ID,
  verificationChannelId: process.env.VERIFICATION_CHANNEL_ID,
  quizHour: Number(process.env.QUIZ_HOUR ?? 20),
  quizMinute: Number(process.env.QUIZ_MINUTE ?? 0),
};

export function getLevelFromXp(xp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xp) current = lvl;
    else break;
  }
  const next = LEVELS.find((l) => l.xp > xp);
  return { current, next, progress: next ? (xp - current.xp) / (next.xp - current.xp) : 1 };
}
