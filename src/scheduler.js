import cron from 'node-cron';
import { env, BRAND } from './config.js';
import { startDailyQuiz } from './systems/quiz.js';
import { getLeaderboard } from './db.js';
import { syryanaEmbed } from './utils/embeds.js';
import { silentPayload } from './utils/notify.js';

export function startScheduler(client) {
  const quizCron = `${env.quizMinute} ${env.quizHour} * * *`;
  const lbCron = '0 12 * * 0';

  if (env.quizChannelId) {
    cron.schedule(quizCron, async () => {
      console.log(`📅 Quiz quotidien (${new Date().toLocaleString('fr-FR', { timeZone: process.env.TZ })})…`);
      const channel = await client.channels.fetch(env.quizChannelId).catch((e) => {
        console.error('❌ Quiz: salon introuvable', e.message);
        return null;
      });
      if (!channel?.isTextBased()) {
        console.error('❌ Quiz: salon invalide ou pas textuel');
        return;
      }
      try {
        await startDailyQuiz(channel);
        console.log('✅ Quiz posté dans', channel.name);
      } catch (e) {
        console.error('❌ Quiz: échec envoi', e.message);
      }
    }, { timezone: process.env.TZ || 'Europe/Paris' });
    console.log(`⏰ Quiz planifié : ${env.quizHour}h${String(env.quizMinute).padStart(2, '0')} (${process.env.TZ}) — le bot doit rester allumé à cette heure`);
  } else {
    console.warn('⚠️ QUIZ_CHANNEL_ID non défini — quiz auto désactivé');
  }

  if (env.leaderboardChannelId) {
    cron.schedule(lbCron, async () => {
      const channel = await client.channels.fetch(env.leaderboardChannelId).catch(() => null);
      if (!channel?.isTextBased()) return;

      const guild = channel.guild;
      const top = getLeaderboard(guild.id, 5);
      if (!top.length) return;

      const lines = await Promise.all(
        top.map(async (row, i) => {
          const u = await client.users.fetch(row.user_id).catch(() => null);
          return `${['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]} **${u?.username ?? '?'}** — ${row.xp} XP`;
        })
      );

      await channel.send(silentPayload({
        embeds: [syryanaEmbed(
          '📊 Classement hebdomadaire Syryana',
          `${lines.join('\n')}\n\nContinue à être actif — nouveau quiz chaque soir ! ${BRAND.emoji}`
        )],
      }));
    });
    console.log('⏰ Récap classement : dimanche 12h');
  }

  if (env.dailyReminder && env.quizChannelId) {
    cron.schedule('0 10 * * *', async () => {
      const channel = await client.channels.fetch(env.quizChannelId).catch(() => null);
      if (!channel?.isTextBased()) return;
      await channel.send(silentPayload({
        embeds: [syryanaEmbed(
          '☀️ Rappel Syryana',
          'N\'oublie pas `/quotidien` et prépare-toi pour le **quiz de ce soir** ! 🔥'
        )],
      })).catch(() => {});
    });
    console.log('⏰ Rappel quotidien 10h activé (ENABLE_DAILY_REMINDER=true)');
  }
}
