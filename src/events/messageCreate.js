import { tryMessageXp } from '../systems/xp.js';
import { handleMessageForChallenge } from '../commands/index.js';
import { checkLevelUp } from '../systems/levelUp.js';
import { isPendingVerification } from '../systems/verification.js';

export async function onMessageCreate(message) {
  if (message.author.bot) return;

  if (!message.guild) {
    await handleMessageForChallenge(message);
    return;
  }

  if (await handleMessageForChallenge(message)) return;

  if (isPendingVerification(message.member)) return;

  const xpResult = tryMessageXp(message.member);
  if (xpResult) {
    const levelEmbed = await checkLevelUp(message.member);
    if (levelEmbed) {
      await message.author.send({ embeds: [levelEmbed] }).catch(() => {});
    }
  }
}
