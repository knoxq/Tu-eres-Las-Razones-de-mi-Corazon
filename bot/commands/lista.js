const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLK8-oVTXEWuEhiDofjNTSLcpdS6FILo-I';
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

let cachedData = null;
let lastFetch = 0;
const CACHE_TTL = 3600000;

export const name = 'lista';
export const aliases = ['canciones', 'songs', 'musicaplaylist'];

function extractTracks(html) {
  const idx = html.indexOf('var ytInitialData = ');
  if (idx === -1) return [];

  const start = idx + 'var ytInitialData = '.length;
  let depth = 0, end = start;
  for (let i = start; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') depth--;
    if (depth === 0) { end = i + 1; break; }
  }

  const data = JSON.parse(html.slice(start, end));
  const tracks = [];

  const sections = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
  for (const section of sections) {
    const items = section?.itemSectionRenderer?.contents || [];
    for (const item of items) {
      const lockup = item?.lockupViewModel;
      if (!lockup?.metadata?.lockupMetadataViewModel?.title?.content) continue;

      const title = lockup.metadata.lockupMetadataViewModel.title.content;
      const sources = lockup?.contentImage?.thumbnailViewModel?.image?.sources || [];
      const vid = sources[0]?.url?.match(/\/vi\/([^/]+)\//)?.[1];
      if (!vid) continue;

      const metaRows = lockup?.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
      const artist = metaRows[0]?.metadataParts?.[0]?.text?.content || '';

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

      tracks.push({ title, artist, duration, url: `https://youtu.be/${vid}` });
    }
  }

  if (tracks.length === 0) {
    const list = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents || [];
    for (const item of list) {
      const vr = item?.playlistVideoRenderer;
      if (!vr?.videoId || !vr?.title?.runs?.[0]?.text) continue;
      tracks.push({
        title: vr.title.runs[0].text,
        artist: vr?.shortBylineText?.runs?.map(r => r.text).join('') || '',
        duration: vr?.lengthText?.simpleText || '',
        url: `https://youtu.be/${vr.videoId}`,
      });
    }
  }

  return tracks;
}

export async function execute(message, client) {
  try {
    await client.sendMessage(message.from, '⏳ Cargando lista de canciones...\n\n_Este proceso toma tiempo, ten paciencia_ 💖');

    if (!cachedData || Date.now() - lastFetch > CACHE_TTL) {
      console.log('🎵 Cargando lista completa desde YouTube...');
      const res = await fetch(PLAYLIST_URL, { headers: { 'User-Agent': USER_AGENT } });
      const html = await res.text();
      cachedData = { tracks: extractTracks(html) };
      lastFetch = Date.now();
      console.log(`🎵 Lista cargada: ${cachedData.tracks.length} canciones`);
    }

    if (!cachedData || cachedData.tracks.length === 0) {
      return client.sendMessage(message.from, '❌ No se pudieron cargar las canciones.');
    }

    let listText = `🎶 *Canciones de la playlist* 🎶\n\n`;
    listText += cachedData.tracks.map((t, i) =>
      `${i + 1}. *${t.title}* — ${t.artist} (${t.duration || '?'})`
    ).join('\n');
    listText += `\n\n💖 — TU ERES las razones DE MI CORAZON`;

    // WhatsApp 4096 char limit per message
    const MAX_LEN = 4000;
    if (listText.length <= MAX_LEN) {
      await client.sendMessage(message.from, listText);
    } else {
      let chunk = `🎶 *Canciones de la playlist* 🎶\n\n`;
      for (const [i, t] of cachedData.tracks.entries()) {
        const line = `${i + 1}. *${t.title}* — ${t.artist} (${t.duration || '?'})\n`;
        if (chunk.length + line.length > MAX_LEN) {
          await client.sendMessage(message.from, chunk);
          chunk = '';
        }
        chunk += line;
      }
      if (chunk) {
        chunk += `\n💖 — TU ERES las razones DE MI CORAZON`;
        await client.sendMessage(message.from, chunk);
      }
    }
  } catch (err) {
    console.error('Error:', err);
    await client.sendMessage(message.from, '❌ Error al cargar la lista de canciones.');
  }
}
