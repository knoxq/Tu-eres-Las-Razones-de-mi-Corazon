import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;

const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLK8-oVTXEWuEhiDofjNTSLcpdS6FILo-I';
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

let cachedInfo = null;
let lastFetch = 0;
const CACHE_TTL = 3600000;

export const name = 'playlist';
export const aliases = ['info'];

function extractPlaylistInfo(html) {
  const idx = html.indexOf('var ytInitialData = ');
  if (idx === -1) return null;

  const start = idx + 'var ytInitialData = '.length;
  let depth = 0, end = start;
  for (let i = start; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') depth--;
    if (depth === 0) { end = i + 1; break; }
  }

  const data = JSON.parse(html.slice(start, end));

  let playlistName = 'Pa mi esposita hermosa';
  let playlistThumbUrl = null;
  let description = '';

  const sidebar = data?.sidebar?.playlistSidebarRenderer?.items || [];
  for (const item of sidebar) {
    const primary = item?.playlistSidebarPrimaryInfoRenderer;
    if (primary?.title?.runs) {
      playlistName = primary.title.runs.map(r => r.text).join('');
    }
    const thumbs = primary?.thumbnailRenderer?.playlistCustomThumbnailRenderer?.thumbnail?.thumbnails || [];
    if (thumbs.length) {
      playlistThumbUrl = thumbs[thumbs.length - 1]?.url;
    }
    // Extract description from stats or description
    if (primary?.description?.runs) {
      description = primary.description.runs.map(r => r.text).join('');
    }
  }

  // Count tracks from sidebar
  const sections = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
  let trackCount = 0;
  for (const section of sections) {
    const items = section?.itemSectionRenderer?.contents || [];
    for (const item of items) {
      if (item?.lockupViewModel?.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url?.match(/\/vi\/([^/]+)\//)) {
        trackCount++;
      }
    }
  }

  return { playlistName, playlistThumbUrl, description, trackCount };
}

export async function execute(message, client) {
  try {
    await client.sendMessage(message.from, '⏳ Cargando información de la playlist...\n\n_Este proceso toma tiempo, ten paciencia_ 💖');

    if (!cachedInfo || Date.now() - lastFetch > CACHE_TTL) {
      console.log('🎵 Cargando info de playlist desde YouTube...');
      const res = await fetch(PLAYLIST_URL, { headers: { 'User-Agent': USER_AGENT } });
      const html = await res.text();
      cachedInfo = extractPlaylistInfo(html);
      lastFetch = Date.now();
    }

    if (!cachedInfo) {
      return client.sendMessage(message.from, '❌ No se pudo cargar la información de la playlist.');
    }

    const text = `🎶 *${cachedInfo.playlistName}* 🎶

📌 ${cachedInfo.trackCount} canciones
${cachedInfo.description ? `📝 ${cachedInfo.description}` : ''}

💖 — TU ERES las razones DE MI CORAZON`;

    if (cachedInfo.playlistThumbUrl) {
      try {
        const media = await MessageMedia.fromUrl(cachedInfo.playlistThumbUrl, { unsafeMime: true });
        await client.sendMessage(message.from, media, { caption: text });
      } catch {
        await client.sendMessage(message.from, text);
      }
    } else {
      await client.sendMessage(message.from, text);
    }
  } catch (err) {
    console.error('Error:', err);
    await client.sendMessage(message.from, '❌ Error al cargar la playlist.');
  }
}
