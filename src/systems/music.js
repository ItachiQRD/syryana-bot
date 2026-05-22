import { spawn } from 'node:child_process';
import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  StreamType,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import ytdl from '@distube/ytdl-core';
import { SlashCommandBuilder } from 'discord.js';
import ffmpegPath from 'ffmpeg-static';
import yts from 'yt-search';
import { env } from '../config.js';
import { errorEmbed, successEmbed, syryanaEmbed } from '../utils/embeds.js';
import { asPrivate } from '../utils/interactions.js';

const MAX_QUEUE = 30;

/** @type {Map<string, GuildMusicState>} */
const guildPlayers = new Map();

/**
 * @typedef {Object} Track
 * @property {string} title
 * @property {string} url
 * @property {string} requestedBy
 * @property {'youtube' | 'direct'} source
 */

/**
 * @typedef {Object} GuildMusicState
 * @property {import('@discordjs/voice').VoiceConnection} connection
 * @property {import('@discordjs/voice').AudioPlayer} player
 * @property {Track[]} queue
 * @property {Track | null} current
 */

export const musicCommand = new SlashCommandBuilder()
  .setName('musique')
  .setDescription('Lecteur VIP Syryana — YouTube et liens audio directs (salon vocal)')
  .addSubcommand((sc) => sc
    .setName('jouer')
    .setDescription('Lire par nom de chanson, lien YouTube ou URL audio directe')
    .addStringOption((o) => o.setName('requete').setDescription('Ex: nom de chanson, artiste, lien YouTube ou .mp3').setRequired(true)))
  .addSubcommand((sc) => sc.setName('passer').setDescription('Passer la piste en cours'))
  .addSubcommand((sc) => sc.setName('arreter').setDescription('Arrêter la musique et vider la file'))
  .addSubcommand((sc) => sc.setName('file').setDescription('Voir la file d\'attente'))
  .addSubcommand((sc) => sc.setName('en-cours').setDescription('Piste en cours de lecture'));

export function isMusicVip(member) {
  if (!env.vipRoleId) {
    return { ok: false, message: 'La musique VIP n\'est pas configurée. Définis **VIP_ROLE_ID** dans le `.env` du bot.' };
  }
  if (member.roles.cache.has(env.vipRoleId)) return { ok: true };
  return { ok: false, message: 'Réservé aux **VIP Syryana**. Obtiens le rôle VIP pour utiliser le lecteur dans les salons vocaux.' };
}

function getVoiceChannel(member) {
  const ch = member.voice.channel;
  if (!ch) {
    return { ok: false, message: 'Rejoins un **salon vocal** pour utiliser la musique.' };
  }
  if (!ch.joinable) {
    return { ok: false, message: 'Je ne peux pas rejoindre ce salon vocal (permissions ou salon plein).' };
  }
  if (!ch.speakable) {
    return { ok: false, message: 'Je n\'ai pas la permission **Parler** dans ce salon.' };
  }
  return { ok: true, channel: ch };
}

function extractVideoId(input) {
  const m = input.trim().match(/(?:v=|\/shorts\/|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

function isYoutubeUrl(input) {
  return /youtube\.com|youtu\.be/i.test(input.trim());
}

function normalizeYoutubeUrl(input) {
  const id = extractVideoId(input);
  if (id) return `https://www.youtube.com/watch?v=${id}`;
  if (isYoutubeUrl(input)) return input.trim();
  return null;
}

function isDirectAudioUrl(input) {
  const t = input.trim();
  if (!/^https?:\/\//i.test(t)) return false;
  return !isYoutubeUrl(t);
}

async function resolveYoutube(input) {
  const trimmed = input.trim();
  let url = normalizeYoutubeUrl(trimmed);
  let title = trimmed;

  if (!url) {
    const search = await yts(trimmed);
    const video = search.videos?.[0];
    if (!video) throw new Error(`Aucun résultat pour « ${trimmed} ».`);
    url = video.url;
    title = video.title;
  } else {
    try {
      const info = await ytdl.getInfo(url);
      title = info.videoDetails.title ?? title;
    } catch {
      /* titre par défaut */
    }
  }

  if (!ytdl.validateURL(url)) {
    throw new Error('Lien YouTube invalide.');
  }

  return { title, url, source: 'youtube' };
}

function createYoutubeResource(url) {
  const stream = ytdl(url, {
    filter: 'audioonly',
    quality: 'highestaudio',
    highWaterMark: 1 << 25,
  });
  stream.on('error', (err) => console.error('[musique ytdl]', err.message));
  return createAudioResource(stream, { inlineVolume: true });
}

function createDirectUrlResource(url) {
  if (!ffmpegPath) {
    throw new Error('FFmpeg introuvable sur le serveur.');
  }
  const ffmpeg = spawn(ffmpegPath, [
    '-re',
    '-i', url,
    '-analyzeduration', '0',
    '-loglevel', 'error',
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2',
    'pipe:1',
  ], { stdio: ['ignore', 'pipe', 'ignore'] });

  ffmpeg.stderr?.on('data', (chunk) => {
    const line = chunk.toString().trim();
    if (line) console.error('[musique ffmpeg]', line);
  });

  return createAudioResource(ffmpeg.stdout, {
    inputType: StreamType.Raw,
    inlineVolume: true,
  });
}

async function getOrCreatePlayer(guild, voiceChannel) {
  let state = guildPlayers.get(guild.id);

  if (state) {
    if (state.connection.joinConfig.channelId !== voiceChannel.id) {
      state.connection.destroy();
      guildPlayers.delete(guild.id);
      state = null;
    }
  }

  if (!state) {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    const player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Play },
    });

    connection.subscribe(player);

    state = { connection, player, queue: [], current: null };

    player.on(AudioPlayerStatus.Idle, () => {
      const st = guildPlayers.get(guild.id);
      if (!st) return;
      st.current = null;
      playNext(guild.id).catch((err) => console.error('[musique] idle:', err));
    });

    player.on('error', (err) => {
      console.error('[musique] player error:', err);
      const st = guildPlayers.get(guild.id);
      if (st) st.current = null;
      playNext(guild.id).catch(() => {});
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        connection.destroy();
        guildPlayers.delete(guild.id);
      }
    });

    guildPlayers.set(guild.id, state);
  }

  return state;
}

async function playTrack(guildId, track) {
  const state = guildPlayers.get(guildId);
  if (!state) return;

  state.current = track;

  const resource = track.source === 'youtube'
    ? await createYoutubeResource(track.url)
    : createDirectUrlResource(track.url);

  state.player.play(resource);
}

async function playNext(guildId) {
  const state = guildPlayers.get(guildId);
  if (!state) return;

  if (!state.queue.length) {
    state.current = null;
    state.connection.destroy();
    guildPlayers.delete(guildId);
    return;
  }

  const next = state.queue.shift();
  try {
    await playTrack(guildId, next);
  } catch (err) {
    console.error('[musique] lecture:', err);
    state.current = null;
    await playNext(guildId);
  }
}

function isPlayerActive(state) {
  const status = state.player.state.status;
  return status === AudioPlayerStatus.Playing || status === AudioPlayerStatus.Buffering;
}

async function enqueue(interaction, input) {
  const vip = isMusicVip(interaction.member);
  if (!vip.ok) {
    return interaction.reply(asPrivate({ embeds: [errorEmbed(vip.message)] }));
  }

  const voice = getVoiceChannel(interaction.member);
  if (!voice.ok) {
    return interaction.reply(asPrivate({ embeds: [errorEmbed(voice.message)] }));
  }

  await interaction.deferReply(asPrivate({}));

  let track;
  try {
    if (isDirectAudioUrl(input)) {
      track = {
        title: input.length > 80 ? `${input.slice(0, 77)}...` : input,
        url: input.trim(),
        requestedBy: interaction.user.tag,
        source: 'direct',
      };
    } else {
      const resolved = await resolveYoutube(input);
      track = { ...resolved, requestedBy: interaction.user.tag };
    }
  } catch (err) {
    console.error('[musique] resolve:', err);
    return interaction.editReply({
      embeds: [errorEmbed(err.message ?? 'Impossible de charger cette piste.')],
    });
  }

  const state = await getOrCreatePlayer(interaction.guild, voice.channel);

  if (state.queue.length >= MAX_QUEUE) {
    return interaction.editReply({
      embeds: [errorEmbed(`File pleine (max **${MAX_QUEUE}** pistes).`)],
    });
  }

  if (!isPlayerActive(state) && !state.current) {
    try {
      await playTrack(interaction.guild.id, track);
      return interaction.editReply({
        embeds: [successEmbed(`▶️ **${track.title}**\n*${track.source === 'youtube' ? 'YouTube' : 'Lien direct'}* — demandé par ${interaction.user}`)],
      });
    } catch (err) {
      console.error('[musique] play:', err);
      const msg = String(err.message ?? err);
      const hint = msg.includes('bot') || msg.includes('Sign in')
        ? 'YouTube bloque temporairement — réessaie dans quelques minutes ou utilise une **URL directe** .mp3.'
        : msg;
      return interaction.editReply({
        embeds: [errorEmbed(`Lecture impossible : ${hint}`)],
      });
    }
  }

  state.queue.push(track);
  const pos = state.queue.length;
  return interaction.editReply({
    embeds: [successEmbed(`Ajouté en file (**#${pos}**) : **${track.title}**`)],
  });
}

function stopGuild(guildId) {
  const state = guildPlayers.get(guildId);
  if (!state) return false;
  state.queue = [];
  state.current = null;
  state.player.stop(true);
  state.connection.destroy();
  guildPlayers.delete(guildId);
  return true;
}

export async function handleMusicCommand(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'jouer') {
    return enqueue(interaction, interaction.options.getString('requete', true));
  }

  const vip = isMusicVip(interaction.member);
  if (!vip.ok) {
    return interaction.reply(asPrivate({ embeds: [errorEmbed(vip.message)] }));
  }

  const guildId = interaction.guild.id;
  const state = guildPlayers.get(guildId);

  if (sub === 'passer') {
    if (!state?.current) {
      return interaction.reply(asPrivate({ embeds: [errorEmbed('Aucune musique en cours.')] }));
    }
    state.player.stop(true);
    return interaction.reply(asPrivate({ embeds: [successEmbed('Piste passée.')] }));
  }

  if (sub === 'arreter') {
    const stopped = stopGuild(guildId);
    return interaction.reply(asPrivate({
      embeds: [stopped ? successEmbed('Musique arrêtée, file vidée.') : errorEmbed('Aucune lecture en cours.')],
    }));
  }

  if (sub === 'file') {
    if (!state?.current && !state?.queue.length) {
      return interaction.reply(asPrivate({ embeds: [errorEmbed('File vide.')] }));
    }
    const lines = [];
    if (state.current) lines.push(`**En cours :** ${state.current.title}`);
    state.queue.forEach((t, i) => lines.push(`**#${i + 1}** ${t.title} — ${t.requestedBy}`));
    return interaction.reply(asPrivate({ embeds: [syryanaEmbed('🎵 File VIP', lines.join('\n'))] }));
  }

  if (sub === 'en-cours') {
    if (!state?.current) {
      return interaction.reply(asPrivate({ embeds: [errorEmbed('Rien en lecture.')] }));
    }
    const t = state.current;
    return interaction.reply(asPrivate({
      embeds: [syryanaEmbed('🎧 En cours', `**${t.title}**\n${t.url}\nDemandé par **${t.requestedBy}**`)],
    }));
  }

  return interaction.reply(asPrivate({ embeds: [errorEmbed('Sous-commande inconnue.')] }));
}
