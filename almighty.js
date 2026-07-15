// Menu immagine + pulsanti per almighty (incollalo dove gestisci il sub 'help')
const MENU_IMAGE_URL = 'path immagine che vuoi';

const ALMIGHTY_MENU_TEXT = `*╭─ 𝐀𝐋𝐌𝐈𝐆𝐇𝐓𝐘 𝐂𝐎𝐌𝐀𝐍𝐃𝐒 ─╮*\n\n*┣━ .almighty promote <numero>*\n┃  Promuove un utente ad admin\n\n*┣━ .almighty demote <numero>*\n┃  Degrada un admin da admin\n\n*┣━ .almighty setowner <numero>*\n┃  Cambia l'owner del gruppo\n\n*┣━ .almighty help*\n┃  Mostra questo menu\n\n*╰─────────────────────────╯*`;

const MENU_BUTTONS = [
  { buttonId: 'alm_promote',  buttonText: { displayText: '🔼 Promuovi' }, type: 1 },
  { buttonId: 'alm_demote',   buttonText: { displayText: '🔽 Degrada' },  type: 1 },
  { buttonId: 'alm_setowner', buttonText: { displayText: '⭐ SetOwner' }, type: 1 },
  { buttonId: 'alm_help',     buttonText: { displayText: 'ℹ️ Help' },     type: 1 },
];

try {
  await global.conn.sendMessage(from, {
    image: { url: MENU_IMAGE_URL },
    caption: ALMIGHTY_MENU_TEXT,
    footer: 'glock-bot',
    buttons: MENU_BUTTONS,
    headerType: 4 // headerType 4 indica immagine come header nelle interactive messages
  }, { quoted: msg });
} catch (e) {
  // fallback: se invio immagine fallisce, invia solo testo + pulsanti
  try {
    await global.conn.sendMessage(from, {
      text: ALMIGHTY_MENU_TEXT,
      footer: 'glock-bot',
      buttons: MENU_BUTTONS,
      headerType: 1
    }, { quoted: msg });
  } catch (err) {
    console.error('[almighty] Errore invio menu:', err);
  }
}
