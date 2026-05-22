import { XP } from '../config.js';
import { grantXp } from '../systems/xp.js';

const voiceSessions = new Map();

export function onVoiceStateUpdate(oldState, newState) {
  const member = newState.member ?? oldState.member;
  if (!member || member.user.bot) return;

  const key = `${member.guild.id}:${member.id}`;
  const joined = !oldState.channelId && newState.channelId;
  const left = oldState.channelId && !newState.channelId;

  if (joined) {
    voiceSessions.set(key, Date.now());
    return;
  }

  if (left && voiceSessions.has(key)) {
    const start = voiceSessions.get(key);
    voiceSessions.delete(key);
    const minutes = Math.floor((Date.now() - start) / 60_000);
    if (minutes >= 1) {
      grantXp(member, minutes * XP.voiceMinute, 'voice');
    }
  }
}
