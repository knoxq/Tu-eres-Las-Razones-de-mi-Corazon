const STORAGE_KEY_PLAYLIST = 'dd_playlist_tracks';
const STORAGE_KEY_PLAYLIST_URL = 'dd_playlist_url';
const STORAGE_KEY_API_KEY = 'dd_yt_api_key';

const DEFAULT_PLAYLIST = [
  { title: "Dream Piano (Local)", source: "https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-493.mp3", isYouTube: false },
  { title: "Te Amo - Melodía", source: "https://www.youtube.com/watch?v=2Vv-BfVoq4g", isYouTube: true },
  { title: "MEDIA LUNA", source: "https://www.youtube.com/watch?v=q2oQPLNRyIE&list=PLK8-oVTXEWuEhiDofjNTSLcpdS6FILo-I&index=2", isYouTube: true }
];

let musicPlaylist = [];
let currentTrackIndex = 0;
let isPlaying = false;
let ytPlayer = null;
let isYtReady = false;
let cachedAudio = null;

function getAudio() {
  if (!cachedAudio) cachedAudio = document.getElementById('bg-audio');
  return cachedAudio;
}

function getYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function loadYouTubeAPI() {
  if (document.getElementById('yt-player')) return;

  const div = document.createElement('div');
  div.id = 'yt-player';
  div.style.display = 'none';
  document.body.appendChild(div);

  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new window.YT.Player('yt-player', {
      height: '0',
      width: '0',
      videoId: '',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0
      },
      events: {
        onReady: () => {
          isYtReady = true;
        },
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.ENDED) {
            ytPlayer.playVideo();
          }
        }
      }
    });
  };

  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

export function loadMusicPlaylist() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PLAYLIST);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        musicPlaylist = parsed;
        return;
      }
    }
  } catch {}
  musicPlaylist = [...DEFAULT_PLAYLIST];
}

export function saveMusicPlaylist(tracks, url) {
  musicPlaylist = tracks;
  try {
    localStorage.setItem(STORAGE_KEY_PLAYLIST, JSON.stringify(tracks));
    if (url) localStorage.setItem(STORAGE_KEY_PLAYLIST_URL, url);
  } catch {}
}

export function resetMusicPlaylist() {
  saveMusicPlaylist([...DEFAULT_PLAYLIST]);
  localStorage.removeItem(STORAGE_KEY_PLAYLIST_URL);
  localStorage.removeItem(STORAGE_KEY_API_KEY);
  currentTrackIndex = 0;
}

export function getCurrentTrack() {
  return musicPlaylist[currentTrackIndex];
}

export function getPlaylist() {
  return musicPlaylist;
}

export function isMusicPlaying() {
  return isPlaying;
}

export function getCurrentTrackIndex() {
  return currentTrackIndex;
}

export function setCurrentTrackIndex(index) {
  currentTrackIndex = ((index % musicPlaylist.length) + musicPlaylist.length) % musicPlaylist.length;
}

export function playTrack() {
  if (!musicPlaylist.length) return;
  const track = musicPlaylist[currentTrackIndex];
  if (!track) return;
  const audio = getAudio();

  if (track.isYouTube) {
    if (audio) audio.pause();

    if (!ytPlayer) {
      loadYouTubeAPI();
    } else if (isYtReady) {
      const videoId = getYouTubeId(track.source);
      if (videoId) {
        const currentVideoUrl = ytPlayer.getVideoUrl ? ytPlayer.getVideoUrl() : '';
        if (!currentVideoUrl || !currentVideoUrl.includes(videoId)) {
          ytPlayer.loadVideoById(videoId);
        } else {
          ytPlayer.playVideo();
        }
      }
    }
  } else {
    if (ytPlayer && isYtReady) ytPlayer.pauseVideo();

    if (audio) {
      if (audio.src !== track.source) audio.src = track.source;
      audio.play().catch(() => {});
    }
  }

  isPlaying = true;
}

export function pauseTrack() {
  const track = musicPlaylist[currentTrackIndex];
  if (track?.isYouTube) {
    if (ytPlayer && isYtReady) ytPlayer.pauseVideo();
  } else {
    const audio = getAudio();
    if (audio) audio.pause();
  }
  isPlaying = false;
}

export function toggleMusic() {
  if (isPlaying) {
    pauseTrack();
  } else {
    playTrack();
  }
}

export function skipTo(index) {
  if (!musicPlaylist.length) return;
  pauseTrack();
  currentTrackIndex = ((index % musicPlaylist.length) + musicPlaylist.length) % musicPlaylist.length;
  playTrack();
}

export function nextTrack() {
  skipTo(currentTrackIndex + 1);
}

export function prevTrack() {
  skipTo(currentTrackIndex - 1);
}

export function updateMusicUI() {
  const track = musicPlaylist[currentTrackIndex];
  if (!track) return;

  const musicBtn = document.getElementById('music-btn');
  const disc = document.getElementById('music-disc');
  const nowTitle = document.getElementById('music-now-title');

  if (nowTitle) nowTitle.textContent = track.title;
  if (disc) {
    disc.classList.toggle('spinning', isPlaying);
  }
  if (musicBtn) {
    musicBtn.classList.toggle('playing', isPlaying);
    const icon = musicBtn.querySelector('.music-icon');
    if (icon) icon.textContent = isPlaying ? '⏸' : '▶';
  }
}

export function extractPlaylistId(url) {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export async function fetchYouTubePlaylist(playlistUrl, apiKey) {
  const playlistId = extractPlaylistId(playlistUrl);
  if (!playlistId) throw new Error('No se pudo extraer el ID de la playlist. Verifica la URL.');

  if (apiKey) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      let msg = `Error de YouTube API (${response.status})`;
      try {
        const err = await response.json();
        if (err?.error?.message) msg = err.error.message;
      } catch {}
      throw new Error(msg);
    }
    const data = await response.json();
    if (!data.items || data.items.length === 0) throw new Error('No se encontraron videos en la playlist.');
    return data.items.map(item => ({
      title: item.snippet.title || 'Sin título',
      source: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      isYouTube: true
    }));
  }

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
  const proxies = [
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => url,
  ];

  let lastError = null;
  for (const makeUrl of proxies) {
    try {
      const response = await fetch(makeUrl(feedUrl));
      if (!response.ok) { lastError = new Error('La playlist no existe o es privada.'); continue; }

      const xml = await response.text();
      if (!xml || xml.length < 100) { lastError = new Error('Respuesta vacía del servidor.'); continue; }

      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      const entries = doc.querySelectorAll('entry');
      if (entries.length === 0) {
        const feedTitle = doc.querySelector('title')?.textContent || '';
        if (feedTitle) {
          lastError = new Error('La playlist existe pero no se pudieron extraer los videos. Usa una API Key.');
        } else {
          lastError = new Error('No se encontraron videos en la playlist.');
        }
        continue;
      }

      return Array.from(entries).map((entry) => {
        const title = entry.querySelector('title')?.textContent || '';
        const videoId = entry.getElementsByTagNameNS('http://www.youtube.com/xml/schemas/2015', 'videoId')[0]?.textContent;
        return {
          title: title || `Video ${videoId}`,
          source: `https://www.youtube.com/watch?v=${videoId}`,
          isYouTube: true
        };
      });
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw new Error(
    'No se pudo cargar la playlist desde el navegador (CORS). ' +
    'Agrega una API Key de YouTube en la configuración avanzada para que funcione. ' +
    (lastError?.message ? `(${lastError.message})` : '')
  );
}
