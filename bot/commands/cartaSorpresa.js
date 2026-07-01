import { capitulos } from '../../src/data/capitulos.js';

export const name = 'carta sorpresa';
export const aliases = ['carta', 'sorpresa', 'cartasorpresa', 'cartas'];

export function execute(message) {
  const randomIndex = Math.floor(Math.random() * capitulos.length);
  const item = capitulos[randomIndex];

  const cartaText = item.carta || item.contenido;
  const preview = cartaText.length > 1500 ? cartaText.substring(0, 1500) + '...' : cartaText;

  const text = `💌 *Carta Sorpresa* 💌

*#${item.id} - ${item.titulo}*

${preview}

— Density Doppler 💖`;
  return message.reply(text);
}
