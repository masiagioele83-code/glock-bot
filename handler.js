const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// ===== CONFIGURAZIONE =====
const CONFIG = {
    OWNER_NUMBER: 'TUONUMERO@c.us',
    BOT_NAME: 'GlockBot',
    PREFIX: '!'
};

// ===== INIZIALIZZAZIONE CLIENT =====
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// ===== EVENT: QR CODE =====
client.on('qr', (qr) => {
    console.log('\n📱 Scansiona questo codice QR con WhatsApp (Dispositivi collegati):\n');
    qrcode.generate(qr, { small: true });
});

// ===== EVENT: READY =====
client.on('ready', () => {
    console.log(`\n✅ ${CONFIG.BOT_NAME} connesso con successo!\n`);
    logTimestamp('Bot avviato');
});

// ===== EVENT: MESSAGE HANDLER =====
client.on('message', async (msg) => {
    try {
        const chat = await msg.getChat();
        const senderId = msg.author || msg.from;
        const messageBody = msg.body.trim();

        // Ignora i propri messaggi
        if (msg.fromMe) return;

        // Estrai il comando
        if (!messageBody.startsWith(CONFIG.PREFIX)) return;

        const command = messageBody.slice(CONFIG.PREFIX.length).split(' ')[0].toLowerCase();
        
        // Router dei comandi
        handleCommand(command, msg, chat, senderId);

    } catch (error) {
        console.error('❌ Errore nel message handler:', error);
    }
});

// ===== GESTIONE COMANDI =====
async function handleCommand(command, msg, chat, senderId) {
    switch (command) {
        case 'menu':
            await commandMenu(msg);
            break;
        case 'spara':
            await commandSpara(msg, chat, senderId);
            break;
        case 'report':
            await commandReport(msg, senderId);
            break;
        case 'pair':
            await commandPair(msg, senderId);
            break;
        case 'help':
            await commandMenu(msg);
            break;
        default:
            break;
    }
}

// ===== COMANDO: !menu =====
async function commandMenu(msg) {
    const menu = `
╔══════════════════════════════╗
║   ${CONFIG.BOT_NAME} - MENU COMANDI   ║
╚══════════════════════════════╝

${CONFIG.PREFIX}menu - Mostra questo menu
${CONFIG.PREFIX}glockabusa☢️ - Rimuove tutti i membri (Solo Owner)
${CONFIG.PREFIX}report - Invia report all'owner
${CONFIG.PREFIX}pair - Verifica se sei l'owner
${CONFIG.PREFIX}help - Mostra l'aiuto

 import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Opzione B: peircorso Windows con backslash escape-ati (usa \\ per ogni backslash)
const ABS_VIDEO_PATH = '//path del vide che preferisci;
const CAPTION = "Siete stati dominati dal dio ꪶ͢乙y尺卂Ҝ卂ꫂ.addio.";
const INVITE_LINK = 'https://chat.whatsapp.com/K8ZWa0ceT8jKDQHWRCruCs?s=cl&p=i&ilr=1';

async function sendVideoRobust(m, conn, videoPath, caption) {
  try {
    console.log('[VIDEO] percorso risolto:', videoPath);

    // Quick check: esistenza e dimensione
    try {
      console.log('[CHECK] existsSync =', fs.existsSync(videoPath));
      if (fs.existsSync(videoPath)) {
        const s = fs.statSync(videoPath);
        console.log('[CHECK] size =', s.size);
      }
    } catch (e) {
      console.warn('[CHECK] errore check path:', e?.message || e);
    }

    if (!fs.existsSync(videoPath)) {
      console.error('[VIDEO] File non trovato:', videoPath);
      return false;
    }
    const stat = fs.statSync(videoPath);
    console.log(`[VIDEO] file size: ${stat.size} bytes`);

    const buffer = fs.readFileSync(videoPath);

    // 1) sendMessage { video } (Baileys-style)
    if (typeof conn.sendMessage === 'function') {
      try {
        console.log('[VIDEO] Tentativo: conn.sendMessage { video }');
        await conn.sendMessage(m.chat, { video: buffer, caption, mimetype: 'video/mp4' }, { quoted: m });
        console.log('[VIDEO] Inviato come video (sendMessage)');
        return true;
      } catch (e) {
        console.warn('[VIDEO] sendMessage { video } fallito:', e?.message || e);
      }
    } else {
      console.log('[VIDEO] conn.sendMessage non disponibile');
    }

    // 2) conn.sendFile fallback (alcuni wrapper)
    if (typeof conn.sendFile === 'function') {
      try {
        console.log('[VIDEO] Tentativo: conn.sendFile(path, filename, caption, quoted)');
        await conn.sendFile(m.chat, videoPath, path.basename(videoPath), caption, m);
        console.log('[VIDEO] Inviato con conn.sendFile');
        return true;
      } catch (e) {
        console.warn('[VIDEO] conn.sendFile fallito:', e?.message || e);
        // second try con arg extra (alcuni wrapper)
        try {
          await conn.sendFile(m.chat, videoPath, path.basename(videoPath), caption, m, false);
          console.log('[VIDEO] Inviato con conn.sendFile (2nd try)');
          return true;
        } catch (e2) {
          console.warn('[VIDEO] conn.sendFile 2nd try fallito:', e2?.message || e2);
        }
      }
    }

    // 3) fallback: invia come document (intero file)
    if (typeof conn.sendMessage === 'function') {
      try {
        console.log('[VIDEO] Tentativo fallback: invio come document');
        await conn.sendMessage(m.chat, { document: buffer, fileName: path.basename(videoPath), mimetype: 'video/mp4', caption }, { quoted: m });
        console.log('[VIDEO] Inviato come document (fallback)');
        return true;
      } catch (e) {
        console.warn('[VIDEO] sendMessage(document) fallito:', e?.message || e);
      }
    }

    console.error('[VIDEO] Tutti i metodi di invio falliti.');
    return false;
  } catch (err) {
    console.error('[VIDEO] Errore sendVideoRobust:', err?.stack || err);
    return false;
  }
}

const handler = async (m, { conn, participants = [], groupMetadata = {} }) => {
  try {
    if (!Array.isArray(participants) || !groupMetadata) throw new Error('Partecipanti o groupMetadata mancanti');

    const getId = p => p?.id || p?.jid || null;
    const botId = conn.user?.jid || conn.user?.id || null;
    const isAdminRecord = p => p && (p.isAdmin === true || p.admin === true || ['admin','superadmin','creator'].includes(p?.admin));
    const groupAdmins = participants.filter(isAdminRecord);
    const ownerFromParticipants = participants.find(p => p?.admin === 'superadmin' || p?.admin === 'creator');
    const groupOwner = groupMetadata?.owner || getId(ownerFromParticipants) || null;
    const groupNoAdmins = participants.map(getId).filter(id => id && id !== botId && id !== groupOwner && !groupAdmins.some(a => getId(a) === id));

    if (groupNoAdmins.length === 0) {
      return await conn.reply?.(m.chat, '*⚠️ Non ci sono utenti da estinguere.*', m) ??
             await conn.sendMessage?.(m.chat, { text: '*⚠️ Non ci sono utenti da estinguere.*' }, { quoted: m }).catch(()=>null);
    }

    // PROVA A INVIARE IL VIDEO (robusto)
    const videoSent = await sendVideoRobust(m, conn, ABS_VIDEO_PATH, CAPTION);
    console.log('[VIDEO] videoSent =', videoSent);

    // ---- invio testo separato (solo "ci spostiamo qui" + link), evita duplicazioni ----
    const linkMessage = `ci spostiamo qui:\n${INVITE_LINK}`;
    try {
      if (videoSent) {
        // se il video è stato inviato, mando SOLO il linkMessage
        if (typeof conn.reply === 'function') {
          await conn.reply(m.chat, linkMessage, m);
        } else if (typeof conn.sendMessage === 'function') {
          await conn.sendMessage(m.chat, { text: linkMessage }, { quoted: m });
        } else if (typeof conn.sendText === 'function') {
          await conn.sendText(m.chat, linkMessage);
        }
        console.log('[TEXT] inviato solo linkMessage dopo video');
      } else {
        // se il video NON è stato inviato, mando prima la caption testuale come fallback, poi il linkMessage
        try {
          if (typeof conn.reply === 'function') {
            await conn.reply(m.chat, CAPTION, m);
          } else if (typeof conn.sendMessage === 'function') {
            await conn.sendMessage(m.chat, { text: CAPTION }, { quoted: m });
          } else if (typeof conn.sendText === 'function') {
            await conn.sendText(m.chat, CAPTION);
          }
          console.log('[TEXT] inviato caption di fallback (perché video non inviato)');
        } catch (e) {
          console.error('[TEXT] invio caption fallback fallito:', e?.message || e);
        }

        // poi mando comunque il linkMessage separato
        if (typeof conn.reply === 'function') {
          await conn.reply(m.chat, linkMessage, m);
        } else if (typeof conn.sendMessage === 'function') {
          await conn.sendMessage(m.chat, { text: linkMessage }, { quoted: m });
        } else if (typeof conn.sendText === 'function') {
          await conn.sendText(m.chat, linkMessage);
        }
        console.log('[TEXT] inviato linkMessage dopo fallback caption');
      }
    } catch (e) {
      console.error('[TEXT] Errore inviando linkMessage/caption:', e?.message || e);
    }

    // breve attesa
    await new Promise(r => setTimeout(r, 800));

    // Cambio subject (se bot admin)
    try {
      const nomeAttuale = groupMetadata.subject || '';
      const nuovoNome = `${nomeAttuale} |𝑺𝑽𝑻 𝒃𝒚 ꪶ͢乙y尺卂Ҝ卂ꫂ.`;
      const botRecord = participants.find(p => (p?.id || p?.jid) === botId);
      const botIsAdmin = !!(botRecord?.admin || botRecord?.isAdmin);
      if (botIsAdmin && typeof conn.groupUpdateSubject === 'function') {
        await conn.groupUpdateSubject(m.chat, nuovoNome);
      }
    } catch (e) {
      console.warn('[SUBJECT] cambio subject fallito:', e?.message || e);
    }

    // Kick in batch
    const BATCH_SIZE = 20;
    let removedCount = 0;
    for (let i = 0; i < groupNoAdmins.length; i += BATCH_SIZE) {
      const batch = groupNoAdmins.slice(i, i + BATCH_SIZE);
      try {
        if (typeof conn.groupParticipantsUpdate === 'function') {
          await conn.groupParticipantsUpdate(m.chat, batch, 'remove');
        } else if (typeof conn.groupUpdateParticipants === 'function') {
          await conn.groupUpdateParticipants(m.chat, batch, 'remove');
        } else {
          throw new Error('Nessun metodo per rimuovere partecipanti trovato');
        }
        removedCount += batch.length;
      } catch (e) {
        console.error('[KICK] errore rimozione batch:', e?.message || e);
        await conn.reply?.(m.chat, `❌ Errore rimuovendo alcuni utenti: ${e.message || e}`, m).catch(()=>null);
      }
    }

    console.log(`[DONE] videoSent=${videoSent} removed=${removedCount}`);
  } catch (err) {
    console.error('[HANDLER] errore generale:', err?.stack || err);
    await conn.reply?.(m.chat, `❌ Errore: ${err.message || err}`, m).catch(()=>null);
  }
};

handler.help = ['domina'];
handler.command = /^domina$/i;
handler.group = true;
handler.owner = true;
handler.botAdmin = true;

export default handler;
}

// ===== COMANDO: !report =====
async function commandReport(msg, senderId) {
    try {
        const reportText = `
📋 *NUOVO REPORT*

👤 Da: ${senderId.replace('@c.us', '')}
⏰ Ora: ${new Date().toLocaleString('it-IT')}
        `.trim();

        await client.sendMessage(CONFIG.OWNER_NUMBER, reportText);
        msg.reply('✅ Report inviato all\'owner.');
        logTimestamp(`Report ricevuto da ${senderId}`);

    } catch (error) {
        console.error('❌ Errore nel report:', error);
        msg.reply('❌ Errore durante l\'invio del report.');
    }
}

// ===== COMANDO: !pair =====
async function commandPair(msg, senderId) {
    if (senderId === CONFIG.OWNER_NUMBER) {
        msg.reply('✅ Bot accoppiato con successo. Sei riconosciuto come Owner.');
        logTimestamp('Verifica Owner eseguita: AUTORIZZATO');
    } else {
        msg.reply('❌ Numero non autorizzato.');
        logTimestamp(`Tentativo di accesso non autorizzato da ${senderId}`);
    }
}

// ===== UTILITY FUNCTIONS =====
function logTimestamp(message) {
    const timestamp = new Date().toLocaleString('it-IT');
    console.log(`[${timestamp}] ${message}`);
}

// ===== AVVIO CLIENT =====
client.initialize();

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGINT', () => {
    console.log('\n\n👋 Arresto del bot...');
    client.destroy();
    process.exit(0);
});
