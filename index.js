//index.js

const { Client, LocalAuth, MessageMedia, Buttons } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// ========================================================
// ==================== CONFIGURAZIONE ====================
// ========================================================

const CONFIG = {
  OWNER_NUMBER: 'QUI METTI IL TUO NUM@c.us',
  BOT_NAME: 'GlockBot',
  PREFIX: '!',
  ALLOW_SELF_COMMANDS: true,
  INTERACTIVE_MODE: true,
  VERSION: '1.0.0',
  CREATOR: 'Glock'
};

// ========================================================
// ==================== INIZIALIZZAZIONE ==================
// ========================================================

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// ========================================================
// ======================= EVENTI =========================
// ========================================================

client.on('qr', (qr) => {
  console.log('\n📱 Scansiona questo codice QR con WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log(`\n✅ ${CONFIG.BOT_NAME} connesso con successo!\n`);
  logTimestamp('Bot avviato');
});

client.on('disconnected', (reason) => {
  console.log(`⚠️ Bot disconnesso. Motivo: ${reason}`);
});

// ========================================================
// ================ LOG STILIZZATO 𝐆𝐋𝐎𝐂𝐊𝐁𝐎𝐓 ===============
// ========================================================

function printGlockBotLog(msg, chat) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const timeAgo = msg.timestamp ? ` • ${Math.floor((Date.now() / 1000 - msg.timestamp))}s fa` : '';

  console.log('\n' + '═'.repeat(75));
  console.log(`┌─ 𝐆𝐋𝐎𝐂𝐊𝐁𝐎𝐓 ───────────────────────────────────────────────────────┐`);
  console.log(`│ Bot: +39 379 122 0942 ~Bot`);
  console.log(`│ Ora: ${timeStr}${timeAgo}`);
  
  const senderId = msg.author || msg.from;
  console.log(`│ Da: ${senderId} ${msg.fromMe ? '(TU)' : ''}`);
  
  const chatName = chat?.name || (chat?.isGroup ? 'Gruppo' : 'Privata');
  console.log(`│ Chat: 👑 𝐆𝐋𝐎𝐂𝐊𝐁𝐎𝐓 👑 (${chatName})`);
  
  let tipo = msg.type;
  if (msg.type === 'image') tipo = 'image';
  else if (msg.type === 'video') tipo = 'video';
  else if (msg.type === 'extendedText' || msg.type === 'chat') tipo = 'extendedText';
  console.log(`│ Tipo: ${tipo}`);
  
  console.log(`│ Dimensione: ${(msg.body || '').length} B`);
  console.log(`│ EXP: 0 | 🍬 10`);
  console.log(`│ Membri: ${chat?.participants?.length || 3}`);
  console.log(`└────────────────────────────────────────────────────────────────────┘\n`);
}

// ========================================================
// ====================== UTILITIES =======================
// ========================================================

function normalizeNumber(num) {
  if (!num) return '';
  return String(num).replace(/[^0-9]/g, '');
}

function isOwner(senderId) {
  return normalizeNumber(senderId) === normalizeNumber(CONFIG.OWNER_NUMBER);
}

function logTimestamp(message) {
  const timestamp = new Date().toLocaleString('it-IT');
  console.log(`[${timestamp}] ${message}`);
}

// ========================================================
// ======================= MENU ===========================
// ========================================================

async function sendGlockMenu(chatId) {
  const IMAGE_URL = '"C:\\Users\\gioll\\OneDrive\\Immagini\\glock-bot\\glock-bot\\MENU\\menu.jpg"';
  const menuText = `*╭─ GLOCKBOT ─╮*\n\n*┣━ .segnala <testo / reply>*\n┃  Invia una segnalazione al creator\n\n*┣━ .ping*\n┃  Mostra la latenza (pong)\n\n*╰────────────────╯`;

  const buttonsArray = [
    { id: 'glk_segnala', body: '🚨 Segnala' },
    { id: 'glk_ping', body: '🏓 Ping' },
    { id: 'glk_help', body: 'ℹ️ Help' }
  ];

  const buttonMsg = new Buttons(menuText, buttonsArray, 'GLOCKBOT', 'by Glock');

  try {
    let media = null;
    try { media = await MessageMedia.fromUrl(IMAGE_URL); } catch (e) {}
    
    if (media) {
      await client.sendMessage(chatId, media, { caption: menuText });
      await new Promise(r => setTimeout(r, 300));
      await client.sendMessage(chatId, buttonMsg);
    } else {
      await client.sendMessage(chatId, buttonMsg);
    }
  } catch (err) {
    console.error('[sendGlockMenu] errore:', err);
  }
}

// ========================================================
// ================== MESSAGE HANDLER ====================
// ========================================================

client.on('message', async (msg) => {
  try {
    const chat = await msg.getChat().catch(() => null);
    printGlockBotLog(msg, chat);

    const senderId = msg.author || msg.from;
    const isFromOwner = isOwner(senderId);
    const isSelf = msg.fromMe;

    if (!isFromOwner && !(isSelf && CONFIG.ALLOW_SELF_COMMANDS)) {
      return;
    }

    if (isSelf) console.log(`🔧 COMANDO DA TE: ${msg.body}`);

    const text = (msg.body || '').trim();
    if (!text) return;

    const prefix = ['!', '.'].find(p => text.startsWith(p));
    if (!prefix) return;

    const command = text.slice(1).trim().split(/\s+/)[0].toLowerCase();

    await handleCommand(command, msg, chat, senderId, isFromOwner);

  } catch (err) {
    console.error('Errore handler:', err);
  }
});

// ========================================================
// ================= GESTIONE COMANDI =====================
// ========================================================

async function handleCommand(command, msg, chat, senderId, isFromOwner) {
  switch (command) {
    case 'menu':
    case 'help':
      await sendGlockMenu(msg.from);
      break;
    case 'ping':
      await commandPing(msg);
      break;
    case 'segnala':
      await handleSegnalaText(msg);
      break;
    case 'glockabusa':
      if (isFromOwner) await commandGlockAbusa(msg, chat);
      break;
    case 'hauntedregna':
      if (isFromOwner) await commandHauntedRegna(msg, chat);
      break;
    case 'pair':
      await commandPair(msg, senderId, isFromOwner);
      break;
  }
}

// ========================================================
// ===================== COMANDI ==========================
// ========================================================

async function commandPair(msg, senderId, isFromOwner) {
  await msg.reply(isFromOwner ? '✅ Owner riconosciuto' : '❌ Non autorizzato');
}

async function commandPing(msg) {
  await msg.reply('🏓 Pong!');
}

async function handleSegnalaText(msg) {
  const text = (msg.body || '').split(' ').slice(1).join(' ');
  if (!text) return await msg.reply('Uso: .segnala <testo>');
  await client.sendMessage(CONFIG.OWNER_NUMBER, text);
  await msg.reply('✅ Segnalazione inviata');
}

async function commandGlockAbusa(msg, chat) {
  await msg.reply('✅ glockabusa eseguito');
}

async function commandHauntedRegna(msg, chat) {
  await msg.reply('✅ hauntedregna avviato');
}

// ========================================================
// ======================= AVVIO ==========================
// ========================================================

client.initialize();

// ========================================================
// =================== CHIUSURA CLIENT ====================
// ========================================================

process.on('SIGINT', () => {
  console.log('\n\n👋 Arresto del bot in corso...');
  client.destroy()
    .then(() => {
      console.log('✅ Client chiuso correttamente');
      process.exit(0);
    })
    .catch(err => {
      console.error('Errore durante la chiusura:', err);
      process.exit(1);
    });
});

console.log('🚀 GLOCKBOT avviato - Attendo comandi...');
