const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const userId = args[0];

if (!userId) {
    console.error("❌ Falta userId para logout");
    process.exit(1);
}

const sessionPath = path.join(__dirname, '.wwebjs_auth', `client_${userId}`);

if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log(`🧹 Sesión client_${userId} eliminada correctamente.`);
} else {
    console.log(`⚠️ No existe ninguna sesión activa para client_${userId}.`);
}
