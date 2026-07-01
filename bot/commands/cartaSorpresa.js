import { capitulos } from '../../src/data/capitulos.js';

const RELEASE_DATE = new Date('2026-07-02T00:00:00');

export const name = 'carta sorpresa';
export const aliases = ['carta', 'sorpresa', 'cartasorpresa', 'cartas'];

export function execute(message) {
  if (Date.now() < RELEASE_DATE.getTime()) {
    const diff = RELEASE_DATE.getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    return message.reply(`💌 Aún no puedo mostrar cartas.\n\nFaltan *${days} días* para el lanzamiento — *2 de Julio de 2026* 💝\n\nMientras tanto, usa *!cuenta* para ver la cuenta regresiva.`);
  }

  const randomIndex = Math.floor(Math.random() * capitulos.length);
  const item = capitulos[randomIndex];

  const cartaText = item.carta || item.contenido;
  const preview = cartaText.length > 1500 ? cartaText.substring(0, 1500) + '...' : cartaText;

  const text = `💌 *Carta Sorpresa* 💌

*#${item.id} - ${item.titulo}*

${preview}

— Tú Eres las Razones de Mi Corazón 💖`;
  return message.reply(text);
}
