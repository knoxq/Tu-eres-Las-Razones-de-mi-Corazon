const STORAGE_KEY = 'amor_12_razones_favs';

let favorites = [];

export function loadFavorites() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    favorites = stored ? JSON.parse(stored) : [];
  } catch {
    favorites = [];
  }
  return favorites;
}

export function getFavorites() {
  return favorites;
}

export function saveFavorites() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function toggleFavorite(id) {
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
    return true;
  } else {
    favorites.splice(index, 1);
    return false;
  }
}

export function isFavorite(id) {
  return favorites.includes(id);
}

export function updateFavBadge() {
  const badge = document.getElementById('fav-count-badge');
  if (badge) badge.textContent = favorites.length.toString();
}
