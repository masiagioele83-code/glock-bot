/ plugins/index/glockbot-menu.js
// Plugin: GLOCKBOT menu (immagine + pulsanti Segnala / Ping)
// Salva come plugins/index/glockbot-menu.js e riavvia il bot.

import fs from 'fs';
import path from 'path';

const IMAGE_URL = '"C:\\Users\\gioll\\OneDrive\\Immagini\\glock-bot\\glock-bot\\MENU\\menu.jpg"';
const PLUGIN_KEY = 'glockbot.menu';
const DATA_FILE = path.resolve('./reports.json');

// helper I/O
function loadReports() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
  } catch (e) {
    console.error('[glockbot.menu] loadReports error', e);
    return [];
  }
}
function saveReport(report) {
  try {
    const arr = loadReports();
    arr.push(report);
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2));
    return true;
  } catch (e) {
    console.error('[glockbot.menu] saveReport error', e);
    return false;
  }
}

// plugin state
const pending = new Map(); // key = chatId|sender -> { action, since }

function setPending(chat, sender, action) {
  const key = `${chat}|${sender}`;
  if (pending.has(key)) clearTimeout(pending.get(key).timeout);
  const timeout = setTimeout(() => pending.delete(key), 60 * 1000);
  pending.set(key, { action, since: Date.now(), timeout });
}
function clearPending(chat, sender) {
  const key = `${chat}|${sender}`;
  const v = pending.get(key);
  if (v) clearTimeout(v.timeout);
  pending.delete(key);
}
function getPending(chat, sender) {
  return pending.get(`${chat}|${sender}`);
}

// menu text
const MENU_TEXT = `*╭─ GLOCKBOT ─╮*

*┣━ .segnala <testo / reply>*
┃  Invia una segnalazione al creator

*┣━ .ping*
┃  Mostra la latenza (pong)

*┣━ .glockmenu / .glockbot / .glock help*
┃  Mostra questo menu

*╰────────────────╯`;

// buttons
const BUTTONS = [
  { buttonId: 'glk_segnala', buttonText: { displayText: '🚨 Segnala' }, type: 1 },
  { buttonId: 'glk_ping',    buttonText: { displayText: '🏓 Ping'    }, type: 1 },
  { buttonId: 'glk_help',    buttonText: { displayText: 'ℹ️ Help'    }, type: 1 },
];

// helper to find creator number
function findCreatorNumber() {
  try {
    const cfgPath = path.resolve('./config.json');
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8') || '{}');
      if (cfg && cfg.creatorNumber) return String(cfg.creatorNumber).replace(/\D/g, '') + '@s.whatsapp.net';
    }
  } catch (e) {}
  if (process.env.CREATOR_NUMBER) return String(process.env.CREATOR_NUMBER).replace(/\D/g, '') + '@s.whatsapp.net';
  if (global && global.sam && Array.isArray(global.sam) && global.sam[0]) return String(global.sam[0]).replace(/\D/g, '') + '@s.whatsapp.net';
  return null;
}

// handler
async function handler(mUp) {
  try {
    if (!mUp.messages || !mUp.messages.length) return;
    const msg = mUp.messages[0];
    if (!msg || !msg.message) return;
    if (msg.key && msg.key.remoteJid === 'status@broadcast') return;

    const from = msg.key.remoteJid;
    const isGroup = from?.endsWith?.('@g.us');
    const sender = msg.key.participant ? msg.key.participant : msg.key.remoteJid;
    const senderDigits = (String(sender || '')).split('@')[0];

    // extract text robustly
    const m = msg.message;
    const text = (m?.conversation)
      || (m?.extendedTextMessage?.text)
      || (m?.imageMessage?.caption)
      || (m?.videoMessage?.caption)
      || (m?.listResponse?.singleSelectReply?.selectedDisplayText)
      || '';

    // detect button presses (multiple variants)
    const br = m?.buttonsResponseMessage
            || m?.templateButtonReplyMessage
            || m?.interactive?.buttonReply
            || m?.buttonResponseMessage
            || m?.listResponseMessage
            || (m?.extendedTextMessage?.contextInfo?.quotedMessage?.buttonsResponseMessage)
            || null;

    if (br) {
      const btnId = br.selectedButtonId || br.selectedId || br.selectedDisplayText || br.replyId || null;
      if (btnId === 'glk_help') {
        // resend menu
        try {
          await global.conn.sendMessage(from, {
            image: { url: IMAGE_URL },
            caption: MENU_TEXT,
            footer: 'GLOCKBOT',
            buttons: BUTTONS,
            headerType: 4
          }, { quoted: msg });
        } catch (e) {
          await global.conn.sendMessage(from, { text: MENU_TEXT, footer: 'GLOCKBOT', buttons: BUTTONS, headerType: 1 }, { quoted: msg });
        }
        return;
      }
      if (btnId === 'glk_ping') {
        // ping: measure roundtrip by sending and measuring
        const t1 = Date.now();
        try {
          await global.conn.sendMessage(from, { text: '🏓 Ping...' }, { quoted: msg });
          const t2 = Date.now();
          await global.conn.sendMessage(from, { text: `🏓 Pong! Latency: ${t2 - t1} ms` }, { quoted: msg });
        } catch (e) {
          console.error('[glockbot.menu] ping error', e);
        }
        return;
      }
      if (btnId === 'glk_segnala') {
        // enable pending segnala for this chat+sender
        setPending(from, senderDigits, 'segnala');
        try {
          await global.conn.sendMessage(from, { text: '🚨 Modalità SEGNALA attivata. Rispondi al messaggio da segnalare o invia il testo della segnalazione. (Scade in 60s)' }, { quoted: msg });
        } catch (e) {}
        return;
      }
    }

    // textual commands
    const lc = String((text || '')).trim();
    const cmd = lc.split(/\s+/)[0]?.toLowerCase();

    // simple triggers: .glockmenu / !glockmenu / .glockbot / !glockbot / .glock help
    if (['.glockmenu','!glockmenu','.glockbot','!glockbot','.glock','.glockhelp','!glock','!glockhelp'].includes(cmd) || (cmd === '.glock' && lc.includes('help'))) {
      try {
        await global.conn.sendMessage(from, {
          image: { url: IMAGE_URL },
          caption: MENU_TEXT,
          footer: 'GLOCKBOT',
          buttons: BUTTONS,
          headerType: 4
        }, { quoted: msg });
      } catch (e) {
        await global.conn.sendMessage(from, { text: MENU_TEXT, footer: 'GLOCKBOT', buttons: BUTTONS, headerType: 1 }, { quoted: msg });
      }
      return;
    }

    // textual ping command
    if (['.ping','!ping','ping'].includes(cmd)) {
      const t1 = Date.now();
      try {
        await global.conn.sendMessage(from, { text: '🏓 Ping...' }, { quoted: msg });
        const t2 = Date.now();
        await global.conn.sendMessage(from, { text: `🏓 Pong! Latency: ${t2 - t1} ms` }, { quoted: msg });
      } catch (e) {
        console.error('[glockbot.menu] ping text error', e);
      }
      return;
    }

    // textual segnala command: handle immediate argument or enable pending
    if (['.segnala','!segnala','segnala'].includes(cmd)) {
      const rest = lc.split(/\s+/).slice(1).join(' ').trim();
      if (rest) {
        // send report immediately
        const creatorJid = findCreatorNumber();
        const reportText = `🚨 Segnalazione da ${sender} (chat: ${from}):\n\n${rest}`;
        if (creatorJid) {
          try {
            await global.conn.sendMessage(creatorJid, { text: reportText });
            await global.conn.sendMessage(from, { text: '✅ Segnalazione inviata al creator.' }, { quoted: msg });
          } catch (e) {
            saveReport({ from, sender, text: rest, ts: Date.now() });
            await global.conn.sendMessage(from, { text: '⚠️ Creazione segnalazione locale (creator non raggiungibile).' }, { quoted: msg });
          }
        } else {
          saveReport({ from, sender, text: rest, ts: Date.now() });
          await global.conn.sendMessage(from, { text: '✅ Segnalazione salvata localmente.' }, { quoted: msg });
        }
      } else {
        setPending(from, senderDigits, 'segnala');
        try {
          await global.conn.sendMessage(from, { text: '🚨 Modalità SEGNALA attivata. Rispondi al messaggio da segnalare o invia il testo della segnalazione. (Scade in 60s)' }, { quoted: msg });
        } catch (e) {}
      }
      return;
    }

    // pending resolution: segnala
    const p = getPending(from, senderDigits);
    if (p && p.action === 'segnala') {
      // try to extract reported content: if this message is a reply, forward quotedMessage; else send text or media info.
      try {
        // if reply to message: forward the quoted message to creator
        const replyCtx = m.extendedTextMessage?.contextInfo;
        const creatorJid = findCreatorNumber();
        if (replyCtx && replyCtx.quotedMessage) {
          // forward quoted message to creator if possible, else save summary
          if (creatorJid) {
            try {
              await global.conn.sendMessage(creatorJid, { text: `🚨 Segnalazione (forward) da ${sender} in ${from}` });
              // attempt to forward (key and message) - use sendMessage with contextInfo not straightforward; fallback: send text summary
              // We'll send quoted message as a new message summarizing type
              const qm = replyCtx.quotedMessage;
              const summary = qm.conversation || qm.extendedTextMessage?.text || qm.imageMessage?.caption || '[media]';
              await global.conn.sendMessage(creatorJid, { text: `Contenuto segnalato:\n\n${summary}` });
              await global.conn.sendMessage(from, { text: '✅ Segnalazione inviata al creator (contenuto inoltrato).' }, { quoted: msg });
            } catch (e) {
              saveReport({ from, sender, quoted: true, content: qm, ts: Date.now() });
              await global.conn.sendMessage(from, { text: '⚠️ Impossibile inoltrare al creator, segnalazione salvata localmente.' }, { quoted: msg });
            }
          } else {
            saveReport({ from, sender, quoted: true, content: replyCtx.quotedMessage, ts: Date.now() });
            await global.conn.sendMessage(from, { text: '✅ Segnalazione salvata localmente.' }, { quoted: msg });
          }
        } else {
          // not a reply: use current text or indicate media
          const reportBody = (text && text.length) ? text : '[contenuto multimediale o non testuale]';
          if (creatorJid) {
            try {
              await global.conn.sendMessage(creatorJid, { text: `🚨 Segnalazione da ${sender} in ${from}:\n\n${reportBody}` });
              await global.conn.sendMessage(from, { text: '✅ Segnalazione inviata al creator.' }, { quoted: msg });
            } catch (e) {
              saveReport({ from, sender, text: reportBody, ts: Date.now() });
              await global.conn.sendMessage(from, { text: '⚠️ Impossibile inviare al creator, segnalazione salvata localmente.' }, { quoted: msg });
            }
          } else {
            saveReport({ from, sender, text: reportBody, ts: Date.now() });
            await global.conn.sendMessage(from, { text: '✅ Segnalazione salvata localmente.' }, { quoted: msg });
          }
        }
      } catch (e) {
        console.error('[glockbot.menu] segnala handling error', e);
        try { await global.conn.sendMessage(from, { text: '❌ Errore nella gestione della segnalazione.' }, { quoted: msg }); } catch {}
      } finally {
        clearPending(from, senderDigits);
      }
      return;
    }

  } catch (e) {
    console.error('[glockbot.menu] handler error', e);
  }
}

// registration (auto start when module is imported)
function start() {
  if (!global.conn || !global.conn.ev) {
    const iv = setInterval(() => {
      if (global.conn && global.conn.ev) {
        clearInterval(iv);
        global.conn.ev.on('messages.upsert', handler);
        console.log('[glockbot.menu] registrato su global.conn.ev (retry)');
      }
    }, 500);
  } else {
    global.conn.ev.on('messages.upsert', handler);
    console.log('[glockbot.menu] registrato su global.conn.ev');
  }
}
function stop() {
  try { if (global.conn && global.conn.ev) global.conn.ev.off('messages.upsert', handler); } catch (e) {}
  for (const [, v] of pending) clearTimeout(v.timeout);
  pending.clear();
  console.log('[glockbot.menu] stoppato');
}

// expose plugin in global.plugins for consistency
global.plugins = global.plugins || {};
global.plugins[PLUGIN_KEY] = { name: PLUGIN_KEY, start, stop };

start();

export {}; // ESM module end
