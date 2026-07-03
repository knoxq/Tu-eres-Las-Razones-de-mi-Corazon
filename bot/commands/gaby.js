import { capitulos } from '../../src/data/capitulos.js';

export const name = 'gaby';
export const aliases = [];

export function execute(message) {
  const lista = capitulos.map(c =>
    `*Capítulo ${c.id}: ${c.titulo}*\n${c.resumen}`
  ).join('\n\n');

  const text = `🌸 *Índice de capítulos* 🌸

${lista}

— Tú Eres las Razones de Mi Corazón 💖`;

  return message.reply(text);
}
