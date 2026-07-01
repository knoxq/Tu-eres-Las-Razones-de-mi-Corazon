export const name = 'menu';
export const aliases = ['menú', 'ayuda', 'help', 'comandos'];

export function execute(message) {
  const menuText = `🌟 *TU ERES las razones DE MI CORAZON* 🌟

Hola, soy el bot del libro — TU ERES las 12 razones DE MI CORAZON —. Usa los comandos con el prefijo *!*:

🌐 *!pagina* o *!link*
Enlace de la página web para leer el libro y las cartas.

📖 *!capitulo* o *!capitulodia*
Capítulo destacado de hoy (basado en la fecha).

💌 *!carta* o *!sorpresa*
Carta de amor aleatoria del libro.

📅 *!cuenta* o *!countdown*
Cuenta regresiva al lanzamiento (2 de julio).

🎵 *!cancion* o *!musica*
Canción aleatoria de la playlist de YouTube.

🎶 *!playlist* o *!info*
Portada, nombre y descripción de la playlist.

📋 *!lista* o *!canciones*
Todas las canciones de la playlist numeradas.

🔍 *!buscar <artista/canción>*
Busca canciones por nombre o artista. Si hay varios resultados, elige por número.

⏰ *!recordatorio* o *!recordar*
Programa un aviso para el 2 de julio.

Responde con cualquier comando para empezar 💖`;
  return message.reply(menuText);
}
