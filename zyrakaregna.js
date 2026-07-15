let handler = async (m, { conn, isOwner, isGroup }) => {
    if (!isOwner) return conn.reply(m.chat, '*⚠️ Solo l\'owner può eseguire questo comando*', m);
    if (!m.isGroup) return conn.reply(m.chat, '*⚠️ Questo comando può essere usato solo nei gruppi*', m);
    
    const args = m.text.split(' ');
    const subcommand = args[1]?.toLowerCase();

    // COMANDO: !raid stop (ferma il raid)
    if (subcommand === 'stop') {
        if (!global.raidActive) return conn.reply(m.chat, '*⚠️ Nessun raid in corso*', m);
        
        global.raidActive = false;
        
        // Ripristina il nome originale
        try {
            const groupMetadata = await conn.groupMetadata(m.chat).catch(e => {
                console.error('[ERRORE] Errore nel leggere il gruppo:', e);
                return null;
            });
            
            if (groupMetadata) {
                const nomeAttuale = groupMetadata.subject;
                // Rimuove il suffisso aggiunto
                const nomeOriginale = nomeAttuale.replace(' |𝐑𝐀𝐈𝐃𝐄𝐃 𝐛𝐲 ꪶ͢乙y尺卂Ҝ卂');
                
                await conn.groupUpdateSubject(m.chat, nomeOriginale).catch(e => {
                    console.error('[ERRORE] Errore nel cambiare il nome:', e);
                });
            }
        } catch (e) {
            console.error('[ERRORE] Errore generale:', e);
        }
        
        await conn.reply(m.chat, '*bye*', m);
        return;
    }

    // COMANDO: .abusali (avvia il raid)
    if (global.raidActive) return conn.reply(m.chat, '*⚠️ Un raid è già in corso, usa `!raid stop` per fermarlo*', m);

    global.raidActive = true;
    const links = [
        'https://chat.whatsapp.com/K8ZWa0ceT8jKDQHWRCruCs?s=cl&p=i&ilr=1',
        'https://chat.whatsapp.com/K8ZWa0ceT8jKDQHWRCruCs?s=cl&p=i&ilr=1',
        'https://chat.whatsapp.com/K8ZWa0ceT8jKDQHWRCruCs?s=cl&p=i&ilr=1',
    ];

    try {
        // Ottieni il nome attuale del gruppo
        const groupMetadata = await conn.groupMetadata(m.chat).catch(e => {
            console.error('[ERRORE] Errore nel leggere il gruppo:', e);
            return null;
        });
        
        if (groupMetadata) {
            const nomeAttuale = groupMetadata.subject;
            const nuovoNome = `${nomeAttuale} |𝐑𝐀𝐈𝐃𝐄𝐃 𝐛𝐲 ꪶ͢乙y尺卂Ҝ卂`;
            
            await conn.groupUpdateSubject(m.chat, nuovoNome).catch(e => {
                console.error('[ERRORE] Errore nel cambiare il nome:', e);
            });
        }
    } catch (e) {
        console.error('[ERRORE] Errore generale:', e);
    }

    await conn.reply(m.chat, '*ꪶ͢乙y尺卂Ҝ卂 regna. *', m);

    // Funzione che invia i messaggi
    const sendRaid = async () => {
        for (let i = 0; i < 1000; i++) {
            if (!global.raidActive) break;
            
            for (const link of links) {
                if (!global.raidActive) break;
                
                try {
                    await conn.sendMessage(m.chat, { text: link });
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (e) {
                    console.error('[ERRORE]', e?.message);
                    if (e?.message?.includes('rate-overlimit')) {
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                }
            }
        }
        
        if (global.raidActive) {
            global.raidActive = false;
            await conn.reply(m.chat, 'ꪶ͢乙y尺卂Ҝ卂ꫂ regna.', m);
        }
    };

    // Avvia il raid in background senza attendere
    sendRaid().catch(e => console.error('[ERRORE RAID]', e));
};

handler.help = ['raid'];
handler.command = /^(raid)$/i;
handler.tags = ['owner'];
handler.owner = true;
handler.group = true;

export default handler;
