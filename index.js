const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Argumento: userId (obligatorio)
const args = process.argv.slice(2);
const userId = args[0];

if (!userId) {
    console.error("❌ Falta userId. Ejecutá: node index.js <user_id>");
    process.exit(1);
}

// Configuraciones
const sessionName = `client_${userId}`;
const API_URL = 'https://mltechbot.up.railway.app'; // 🌐 URL del panel

// Directorio local para guardar QR
const qrDir = path.join(__dirname, 'qrs');
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir);

// Cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessionName }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

// Evento: generar QR
client.on('qr', async (qr) => {
    try {
        const qrBase64 = await QRCode.toDataURL(qr);
        const res = await fetch(`${API_URL}/api/guardar_qr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                qr: qrBase64
            })
        });

        if (res.ok) {
            console.log(`✅ QR enviado al panel para el usuario ${userId}`);
        } else {
            console.error('❌ Error al enviar el QR al panel:', await res.text());
        }
    } catch (err) {
        console.error('❌ Error generando o enviando QR:', err.message);
    }
});


// Evento: listo
client.on('ready', () => {
    console.log(`✅ Bot conectado y listo para usuario ${userId}`);
});

// Evento: mensaje entrante
client.on('message', async (msg) => {
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

// Iniciar cliente
client.initialize();
