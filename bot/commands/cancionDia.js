import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;

const PLAYLIST_ID = 'PLK8-oVTXEWuEhiDofjNTSLcpdS6FILo-I';
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

let cachedData = null;
let lastFetch = 0;
const CACHE_TTL = 3600000;

export const name = 'canción del día';
export const aliases = ['cancion', 'canción', 'musica', 'música', 'song'];

function extractPlaylistData(html) {
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
  const tracks = [];

  // Extract playlist name and thumbnail from sidebar
  let playlistName = 'Pa mi esposita hermosa';
  let playlistThumbUrl = null;
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
  }

  // Extract tracks from lockupViewModel format
  const sections = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
  for (const section of sections) {
    const items = section?.itemSectionRenderer?.contents || [];
    for (const item of items) {
      const lockup = item?.lockupViewModel;
      if (!lockup?.metadata?.lockupMetadataViewModel?.title?.content) continue;

      const title = lockup.metadata.lockupMetadataViewModel.title.content;
      const sources = lockup?.contentImage?.thumbnailViewModel?.image?.sources || [];
      const thumbUrl = sources[0]?.url?.replace(/\?.*/, '') || '';
      const vid = thumbUrl.match(/\/vi\/([^/]+)\//)?.[1];
      if (!vid) continue;

      // Extract artist from metadata rows (first part of first row)
      const metaRows = lockup?.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
      const artist = metaRows[0]?.metadataParts?.[0]?.text?.content || '';

      // Extract duration from bottom overlay badge
      const overlays = lockup?.contentImage?.thumbnailViewModel?.overlays || [];
      let duration = '';
      for (const overlay of overlays) {
        const badges = overlay?.thumbnailBottomOverlayViewModel?.badges || [];
        for (const badge of badges) {
          if (badge?.thumbnailBadgeViewModel?.text) {
            duration = badge.thumbnailBadgeViewModel.text;
          }
        }
      }

      tracks.push({
        title,
        videoId: vid,
        url: `https://youtu.be/${vid}`,
        artist,
        duration,
        thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
      });
    }
  }

  // Fallback to old playlistVideoRenderer format
  if (tracks.length === 0) {
    const list = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents || [];
    for (const item of list) {
      const vr = item?.playlistVideoRenderer;
      if (!vr?.videoId || !vr?.title?.runs?.[0]?.text) continue;
      tracks.push({
        title: vr.title.runs[0].text,
        videoId: vr.videoId,
        url: `https://youtu.be/${vr.videoId}`,
        artist: vr?.shortBylineText?.runs?.map(r => r.text).join('') || '',
        duration: vr?.lengthText?.simpleText || '',
        thumbnail: `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`,
      });
    }
  }

  return { playlistName, playlistThumbUrl, tracks };
}

export async function execute(message, client) {
  try {
    // Send warning immediately
    await client.sendMessage(message.from, '⏳ Un momento, estoy cargando la playlist...\n\n_Este proceso toma tiempo, ten paciencia_ 💖');

    // Fetch or use cache
    if (!cachedData || Date.now() - lastFetch > CACHE_TTL) {
      console.log('🎵 Cargando playlist desde YouTube...');
      const res = await fetch(PLAYLIST_URL, { headers: { 'User-Agent': USER_AGENT } });
      const html = await res.text();
      cachedData = extractPlaylistData(html);
      lastFetch = Date.now();
      if (cachedData) {
        console.log(`🎵 Playlist cargada: "${cachedData.playlistName}" (${cachedData.tracks.length} canciones)`);
      }
    }

    if (!cachedData || cachedData.tracks.length === 0) {
      return client.sendMessage(message.from, '❌ La playlist está vacía o no está disponible.');
    }

    const index = Math.floor(Math.random() * cachedData.tracks.length);
    const track = cachedData.tracks[index];
    console.log(`🎵 Canción elegida: [${index}/${cachedData.tracks.length}] "${track.title}" — ${track.artist} (${track.duration})`);

    const songText = `🎵 *Canción del día* 🎵

*${track.title}*
🎤 ${track.artist} | ⏱ ${track.duration}

🎧 ${track.url}

_Playlist: ${cachedData.playlistName}_ 💖`;

    // Send playlist cover image with song info as caption
    try {
      const coverUrl = track.thumbnail;
      const media = await MessageMedia.fromUrl(coverUrl, { unsafeMime: true });
      await client.sendMessage(message.from, media, { caption: songText });
    } catch {
      // Fallback: send text only if image fails
      await client.sendMessage(message.from, songText);
    }
  } catch (err) {
    console.error('Error fetching playlist:', err);
    await client.sendMessage(message.from, '❌ No pude obtener la playlist. Intenta de nuevo más tarde.');
  }
}
