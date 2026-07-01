import schedule from 'node-schedule';

const reminders = new Map();

export const name = 'recordatorio';
export const aliases = ['recordar', 'recordatorio', 'notificar', 'alarma', 'aviso'];

export function execute(message, client) {
  const from = message.from;
  const pushName = message._data?.notifyName || 'Usuario';

  if (reminders.has(from)) {
    return message.reply('⏰ Ya tienes un recordatorio programado. Te avisaré el 2 de julio cuando el libro esté disponible 💖');
  }

  const releaseDate = new Date('2026-07-02T00:00:00');

  const job = schedule.scheduleJob(releaseDate, async () => {
    try {
      await client.sendMessage(from, `🎉 *¡Ya está disponible!* 🎉\n\nHola ${pushName}, el libro ya está publicado.\n\nEntra aquí para leerlo: https://tudominio/libro\n\nGracias por esperar 💖`);
    } catch (err) {
      console.error('Error sending reminder:', err);
    }
    reminders.delete(from);
  });

  if (job) {
    reminders.set(from, job);

    const now = Date.now();
    const diff = releaseDate.getTime() - now;
    const days = Math.floor(diff / 86400000);

    const text = `⏰ *Recordatorio programado* ⏰

Te avisaré el *2 de julio* cuando el libro esté disponible (faltan ${days} días).

Gracias por tu paciencia, ${pushName} 💖`;
    return message.reply(text);
  } else {
    return message.reply('❌ La fecha de lanzamiento ya pasó. El libro ya debería estar disponible.');
  }
}
