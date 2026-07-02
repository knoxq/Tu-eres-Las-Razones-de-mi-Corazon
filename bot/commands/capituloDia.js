import { capitulos } from '../../src/data/capitulos.js';

const RELEASE_DATE = new Date('2026-07-02T00:00:00-06:00');

export const name = 'capítulo del día';
export const aliases = ['capitulo', 'capítulo', 'capitulodia', 'razondeldia'];

export function execute(message) {
  if (Date.now() < RELEASE_DATE.getTime()) {
    const diff = RELEASE_DATE.getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    return message.reply(`📖 Aún no puedo mostrar capítulos.\n\nFaltan *${days} días* para el lanzamiento — *2 de Julio de 2026* 💝\n\nMientras tanto, usa *!cuenta* para ver la cuenta regresiva.`);
  }

  const seed = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const randomIndex = Math.abs(hash) % capitulos.length;
  const item = capitulos[randomIndex];

  const text = `📖 *Capítulo del día* 📖

*#${item.id} - ${item.titulo}*

"${item.resumen}"

— Tú Eres las Razones de Mi Corazón 💖`;
  return message.reply(text);
}
