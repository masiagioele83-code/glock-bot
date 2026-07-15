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

    `.trim();

    msg.reply(menu);
}

// ===== COMANDO: !glockabusa (NUKE) =====
async function commandGlockabusa(msg, chat, senderId) {
    // Verifica se è l'owner
    if (senderId !== CONFIG.OWNER_NUMBER) {
        msg.reply('❌ Solo il proprietario può usare questo comando.');
        return;
    }

    // Verifica se è un gruppo
    if (!chat.isGroup) {
        msg.reply('❌ Questo comando può essere usato solo nei gruppi.');
        return;
    }

    // Verifica se il bot è admin
    const botContact = await client.getContactById(client.info.wid._serialized);
    const isAdmin = chat.participants.some(p => 
        p.id._serialized === botContact.id._serialized && (p.isAdmin || p.isSuperAdmin)
    );

    if (!isAdmin) {
        msg.reply('❌ Il bot deve essere amministratore del gruppo per eseguire il comando.');
        return;
    }

    msg.reply('☢️ Avvio nuke del gruppo...');
    logTimestamp(`Nuke avviato in ${chat.name}`);

    let removedCount = 0;
    let failedCount = 0;

    for (let participant of chat.participants) {
        // Evita di rimuovere il bot e l'owner
        if (participant.id._serialized !== botContact.id._serialized && 
            participant.id._serialized !== CONFIG.OWNER_NUMBER) {
            try {
                await chat.removeParticipants([participant.id._serialized]);
                removedCount++;
            } catch (err) {
                console.error(`❌ Impossibile rimuovere ${participant.id._serialized}:`, err.message);
                failedCount++;
            }
        }
    }

    const summary = `✅ Nuke completato: ${removedCount} rimossi, ${failedCount} errori`;
    chat.sendMessage(summary);
    console.log(summary);
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
