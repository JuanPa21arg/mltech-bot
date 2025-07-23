const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fetch = require('node-fetch');

const args = process.argv.slice(2);
const userId = args[0]; // Recibido como argumento

if (!userId) {
    console.error("❌ Falta userId. Ejecutá: node index.js <user_id>");
    process.exit(1);
}

const sessionName = `client_${userId}`;
const API_URL = 'https://mltechbot.up.railway.app'; // ✅ TU DOMINIO

const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessionName }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log(`📲 Escaneá este código QR para usuario ID ${userId}:`);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log(`✅ Bot conectado y listo para usuario ${userId}`);
});

client.on('message', async msg => {
    const texto = msg.body.toLowerCase();
    const numero = msg.from.split('@')[0];

    try {
        const res = await fetch(`${API_URL}/api/responder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mensaje: texto,
                numero: numero,
                user_id: userId
            })
        });

        const data = await res.json();
        if (data.respuesta) {
            await msg.reply(data.respuesta);
            console.log(`📩 Respondido a ${numero}`);
        } else {
            await msg.reply('Lo siento, no entendí tu mensaje.');
        }

    } catch (err) {
        console.error('❌ Error al contactar al panel:', err.message);
    }
});

client.initialize();
