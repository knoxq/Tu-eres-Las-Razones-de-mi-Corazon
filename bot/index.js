import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import schedule from 'node-schedule';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Process-level error handling to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('⚠️ Error no capturado:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('⚠️ Promesa rechazada no capturada:', err?.message || err);
});

// Load all commands dynamically
const commands = new Map();
const commandsDir = path.join(__dirname, 'commands');
let loadedCommands = 0;

fs.readdirSync(commandsDir).forEach(file => {
  if (file.endsWith('.js')) {
    import(`./commands/${file}`).then(mod => {
      commands.set(mod.name.toLowerCase(), mod.execute);
      mod.aliases.forEach(alias => commands.set(alias.toLowerCase(), mod.execute));
      loadedCommands++;
      console.log(`✓ Comando cargado: ${mod.name}`);
    }).catch(err => {
      console.error(`✗ Error al cargar comando ${file}:`, err.message);
    });
  }
});

// Bot config
const ADMIN_NUMBER = ''; // Opcional: número admin para notificaciones
const ADMIN_KEY = 'dd-amor-2026';
const GROUP_IDS = [
  '120363428674226150@g.us', // Grupo 1
  '120363412907627446@g.us', // Grupo 2
];
// Para obtener el ID de un nuevo grupo: envía "!chatid" al bot desde ese grupo

// Fecha de lanzamiento del libro
const RELEASE_DATE = new Date('2026-07-02T00:00:00');

// Envía un mensaje a todos los grupos configurados
async function sendToGroups(text) {
  for (const groupId of GROUP_IDS) {
    try {
      await client.sendMessage(groupId, text);
      console.log(`📤 Recordatorio enviado a ${groupId}`);
    } catch (err) {
      console.error(`✗ Error al enviar a ${groupId}:`, err.message);
    }
  }
}

// Guard para evitar programar recordatorios más de una vez (el evento ready puede dispararse varias veces)
let remindersScheduled = false;

// Programa los recordatorios automáticos hacia el lanzamiento
function scheduleCountdownReminders() {
  if (remindersScheduled) {
    console.log('ℹ️ Los recordatorios ya estaban programados, se omite.');
    return;
  }
  remindersScheduled = true;

  const now = Date.now();

  // Si ya pasó el lanzamiento, no programar nada
  if (now >= RELEASE_DATE.getTime()) {
    console.log('ℹ️ El lanzamiento ya pasó, no se programan recordatorios.');
    return;
  }

  // Recordatorio cada hora (en el minuto 0) mientras no se haya lanzado
  const hourlyJob = schedule.scheduleJob('0 * * * *', async () => {
    const diff = RELEASE_DATE.getTime() - Date.now();
    if (diff <= 0) {
      hourlyJob.cancel();
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    let timeLeft;
    if (days > 0) {
      timeLeft = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      timeLeft = `${hours}h ${minutes}m`;
    } else {
      timeLeft = `${minutes}m`;
    }

    const text = `⏰ *Cuenta regresiva*

Quedan *${timeLeft}* para el lanzamiento del libro.

*2 de Julio de 2026* 💝

Usa *!cuenta* para ver el tiempo exacto.`;

    await sendToGroups(text);
  });

  // 10 minutos antes del lanzamiento
  const tenMinDate = new Date(RELEASE_DATE.getTime() - 10 * 60000);
  if (tenMinDate.getTime() > now) {
    schedule.scheduleJob(tenMinDate, async () => {
      const text = `🚨 *¡Faltan 10 minutos!* 🚨

El libro se desbloquea en *10 minutos*.

Prepárate, very pronto podrás leerlo en:
https://tu-eres-las-razones-de-mi-corazon.pages.dev/libro 💖`;

      await sendToGroups(text);
    });
  }

  // 5 minutos antes del lanzamiento
  const fiveMinDate = new Date(RELEASE_DATE.getTime() - 5 * 60000);
  if (fiveMinDate.getTime() > now) {
    schedule.scheduleJob(fiveMinDate, async () => {
      const text = `🚨 *¡Faltan 5 minutos!* 🚨

El libro se desbloquea en *5 minutos*.

Entra ahora para que estés listo:
https://tu-eres-las-razones-de-mi-corazon.pages.dev/libro 💖`;

      await sendToGroups(text);
    });
  }

  console.log('✅ Recordatorios programados: cada hora + 10 y 5 min antes del lanzamiento');
}

// State compartido entre comandos (búsquedas pendientes, etc.)
const botState = { pendingSearches: new Map() };

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'tu-eres-las-razones' }),
  puppeteer: {
    executablePath: '/home/z-knoxzx/.cache/puppeteer/chrome-headless-shell/linux-130.0.6723.58/chrome-headless-shell-linux64/chrome-headless-shell',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-sync',
      '--disable-background-networking',
      '--disable-default-apps',
      '--js-flags=--max-old-space-size=256',
    ],
  },
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('\n🔐 Escanea el código QR con tu WhatsApp');
  console.log('   (WhatsApp > Dispositivos vinculados > Vincular dispositivo)\n');
});

client.on('ready', async () => {
  console.log('🤖 Bot de Tú Eres las Razones de Mi Corazón conectado y listo!');
  console.log(`📅 Fecha de lanzamiento: 2 de Julio de 2026`);
  console.log(`🔑 Admin key: ${ADMIN_KEY}`);
  console.log(`📚 ${loadedCommands} comandos disponibles\n`);

  try {
    await client.setDisplayName('TU ERES las razones DE MI CORAZON');
    console.log('✅ Nombre del bot actualizado');
  } catch (err) {
    console.log('ℹ️ No se pudo cambiar el nombre del bot:', err.message);
  }

  scheduleCountdownReminders();

  if (ADMIN_NUMBER) {
    client.sendMessage(ADMIN_NUMBER, '🤖 Bot Tú Eres las Razones de Mi Corazón iniciado correctamente.');
  }
});

client.on('message', async (message) => {
  console.log(`📩 [${message.from}] tipo:${message.type} "${message.body}"`);

  if (!message.body || !message.body.trim()) return;

  const text = message.body.toLowerCase().trim();
  const isGroup = message.from.endsWith('@g.us');

  // Comando !id — responder siempre, con manejo de errores
  if (text === '!id' || text === '!chatid' || text === '!groupid') {
    try {
      const reply = isGroup
        ? `🆔 ID de este grupo:\n\`${message.from}\`\n\nCopia ese ID y ponlo en \`GROUP_ID\` en bot/index.js`
        : `🆔 ID de este chat:\n\`${message.from}\``;
      console.log(`→ ${message.from}: "${message.body}" → respondiendo !id`);
      await client.sendMessage(message.from, reply);
      return;
    } catch (err) {
      console.error(`✗ Error al responder !id a ${message.from}:`, err.message);
      return;
    }
  }

  // Responder a números de búsqueda pendiente (antes del filtro fromMe para que el dueño también pueda)
  const pending = botState.pendingSearches.get(message.from);
  if (pending && /^\d+$/.test(text)) {
    const num = parseInt(text, 10);
    if (num >= 1 && num <= pending.results.length) {
      const track = pending.results[num - 1];
      await client.sendMessage(message.from, `🎵 *${track.title}* — ${track.artist}\n⏱ ${track.duration}\n🎧 ${track.url}`);
      botState.pendingSearches.delete(message.from);
    } else {
      await message.reply(`❌ Número inválido. Responde con un número entre 1 y ${pending.results.length}, o escribe *!cancelar* para salir.`);
    }
    return;
  }

  // Cancelar búsqueda pendiente
  if (pending && text === '!cancelar') {
    botState.pendingSearches.delete(message.from);
    await message.reply('✅ Búsqueda cancelada.');
    return;
  }

  // Ignorar mensajes del propio bot (para evitar ecos)
  if (message.fromMe) return;

  // Solo procesar comandos en chats de texto
  if (message.type !== 'chat' && message.type !== 'text') return;

  // Debug: mostrar grupos donde se reciben mensajes si no hay grupos configurados
  if (isGroup && GROUP_IDS.length === 0) {
    console.log(`💬 Grupo detectado: ${message.from} — "${message.body}"`);
  }

  // Solo responder en los grupos configurados
  if (GROUP_IDS.length > 0 && !GROUP_IDS.includes(message.from)) return;

  // Solo responder a comandos que empiecen con !
  if (!text.startsWith('!')) return;

  const cmd = text.slice(1).split(/\s+/)[0];
  const handler = commands.get(cmd);

  if (!handler) {
    console.log(`❓ Comando no encontrado: "${cmd}"`);
    return;
  }

  try {
    await handler(message, client, botState);
    console.log(`→ ${message.from}: "${message.body}"`);
  } catch (err) {
    console.error(`Error handling command "${message.body}":`, err.message);
    try {
      await message.reply('❌ Ocurrió un error al procesar tu mensaje. Intenta de nuevo.');
    } catch (_) { /* ignore reply errors */ }
  }
});

// Reconexión con backoff exponencial
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 60; // segundos máximos de espera

async function startBot() {
  try {
    reconnectAttempts = 0;
    await client.initialize();
  } catch (err) {
    console.error('✗ Error al iniciar el bot:', err.message);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  reconnectAttempts++;
  const delay = Math.min(5 * Math.pow(1.5, reconnectAttempts - 1), MAX_RECONNECT_DELAY);
  console.log(`🔄 Reintento ${reconnectAttempts} en ${delay} segundos...`);
  setTimeout(async () => {
    try {
      await client.initialize();
      reconnectAttempts = 0;
    } catch (err) {
      console.error(`✗ Error en reintento ${reconnectAttempts}:`, err.message);
      scheduleReconnect();
    }
  }, delay * 1000);
}

client.on('disconnected', (reason) => {
  console.log('❌ Bot desconectado:', reason);
  scheduleReconnect();
});

console.log('🚀 Iniciando bot de Tú Eres las Razones de Mi Corazón...');
startBot();
