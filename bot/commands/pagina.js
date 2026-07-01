const SITE_URL = 'https://tu-eres-las-razones-de-mi-corazon.pages.dev';

export const name = 'pagina';
export const aliases = ['link', 'enlace', 'web', 'sitio', 'url', 'libro', 'entrar'];

export function execute(message) {
  const text = `🌐 *Nuestra página web* 🌐

Entra al libro desde aquí:

🔗 ${SITE_URL}

📖 Lee todos los capítulos: ${SITE_URL}/libro
💌 Lee las cartas: ${SITE_URL}/cartas

— TU ERES las razones DE MI CORAZON 💖`;
  return message.reply(text);
}
