const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLK8-oVTXEWuEhiDofjNTSLcpdS6FILo-I';
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

let cachedTracks = null;
let lastFetch = 0;
const CACHE_TTL = 3600000;

export const name = 'buscar';
export const aliases = ['search', 'busqueda', 'find', 'filtrar'];

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

  return tracks;
}

export async function execute(message, client, botState) {
  try {
    const args = message.body.split(' ').slice(1).join(' ').trim();
    if (!args) {
      return message.reply('🔍 Escribe *!buscar <artista o canción>* para buscar.\n\nEjemplo: `!buscar Mora` o `!buscar Compass`');
    }

    // Fetch playlist if not cached
    await message.reply('⏳ Cargando playlist... _ten paciencia_ 💖');

    if (!cachedTracks || Date.now() - lastFetch > CACHE_TTL) {
      const res = await fetch(PLAYLIST_URL, { headers: { 'User-Agent': USER_AGENT } });
      const html = await res.text();
      cachedTracks = extractTracks(html);
      lastFetch = Date.now();
      if (!cachedTracks || cachedTracks.length === 0) {
        return message.reply('❌ No se pudo cargar la playlist.');
      }
      console.log(`🔍 Playlist cargada para búsqueda: ${cachedTracks.length} canciones`);
    }

    // Search query (case insensitive)
    const query = args.toLowerCase();
    const results = cachedTracks.filter(t =>
      t.title.toLowerCase().includes(query) || t.artist.toLowerCase().includes(query)
    );

    if (results.length === 0) {
      return message.reply(`🔍 No encontré nada para "${args}". Intenta con otro término.`);
    }

    if (results.length === 1) {
      const t = results[0];
      return message.reply(`🎵 *${t.title}* — ${t.artist}\n⏱ ${t.duration}\n🎧 ${t.url}`);
    }

    // Multiple results: show numbered list and store pending state
    let list = `🔍 *${results.length} resultados para "${args}"*\n\n`;
    list += results.map((t, i) => `${i + 1}. *${t.title}* — ${t.artist} (${t.duration})`).join('\n');
    list += `\n\n✏️ Responde con el *número* de la canción que quieres.`;
    list += `\nEscribe *!cancelar* para salir.`;

    botState.pendingSearches.set(message.from, { results });
    await message.reply(list);
  } catch (err) {
    console.error('Error buscando:', err);
    await message.reply('❌ Error al buscar. Intenta de nuevo.');
  }
}
