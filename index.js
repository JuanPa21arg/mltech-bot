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
    const outputPath = path.join(qrDir, `qr_${userId}.png`);
    const panelPath = `/home/ubuntu/mltech-bot/static/qrs/qr_${userId}.png`; // VPS ruta absoluta

    try {
        await QRCode.toFile(outputPath, qr);
        console.log(`✅ QR generado para user ${userId}: ${outputPath}`);

        fs.copyFileSync(outputPath, panelPath);
        console.log(`📂 QR copiado al panel: ${panelPath}`);
    } catch (err) {
        console.error('❌ Error al generar o copiar QR:', err);
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
