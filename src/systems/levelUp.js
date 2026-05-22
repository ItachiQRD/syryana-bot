import { getProfile } from './xp.js';
import { syryanaEmbed } from '../utils/embeds.js';

const lastLevel = new Map();

export async function checkLevelUp(member) {
  const key = `${member.guild.id}:${member.id}`;
  const { current } = getProfile(member);
  const prev = lastLevel.get(key);

  if (prev === undefined) {
    lastLevel.set(key, current.level);
    return null;
  }

  if (current.level > prev) {
    lastLevel.set(key, current.level);
    return syryanaEmbed(
      'Niveau supérieur !',
      `${member} passe **Niveau ${current.level}** — *${current.title}* ! 🎉`
    );
  }

  lastLevel.set(key, current.level);
  return null;
}
