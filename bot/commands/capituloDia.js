import { capitulos } from '../../src/data/capitulos.js';

export const name = 'capítulo del día';
export const aliases = ['capitulo', 'capítulo', 'capitulodia', 'razondeldia'];

export function execute(message) {
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

— Density Doppler 💖`;
  return message.reply(text);
}
