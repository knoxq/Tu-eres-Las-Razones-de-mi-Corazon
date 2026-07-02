export const name = 'cuenta regresiva';
export const aliases = ['cuenta regresiva', 'cuenta', 'regresiva', 'countdown', 'tiempo', 'falta', 'lanzamiento'];

export function execute(message) {
  const releaseDate = new Date('2026-07-02T00:00:00-06:00');
  const now = new Date();
  const diff = releaseDate.getTime() - now.getTime();

  if (diff <= 0) {
    return message.reply('🎉 *¡Ya está disponible!* 🎉\n\nEl libro ya está publicado. Entra a https://tu-eres-las-razones-de-mi-corazon.pages.dev/libro para leerlo 💖');
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const text = `📅 *Cuenta Regresiva* 📅

Faltan exactamente:

${days} días
${hours} horas
${minutes} minutos
${seconds} segundos

para el lanzamiento oficial del libro.

*2 de Julio de 2026 — 00:00 (Hora de Aguascalientes, México)* 💝

— Tú Eres las Razones de Mi Corazón`;
  return message.reply(text);
}
