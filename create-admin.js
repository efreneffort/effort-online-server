// Ejecutar una sola vez: node create-admin.js
require('dotenv').config();
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'efren@effortonline.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Efrén Pérez';

if (!ADMIN_PASSWORD) {
    console.error('❌ Define ADMIN_PASSWORD en .env antes de ejecutar este script.');
    process.exit(1);
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const UserSchema = new mongoose.Schema({
        name:     String,
        email:    { type: String, unique: true },
        password: String,
        phone:    String,
        plan:     { type: String, default: 'elite' },
        period:   { type: String, default: 'monthly' },
        isActive: { type: Boolean, default: true },
        role:     { type: String, default: 'admin' },
        createdAt:{ type: Date, default: Date.now }
    });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const exists = await User.findOne({ email: ADMIN_EMAIL });
    if (exists) {
        console.log(`⚠️  Ya existe un usuario con email ${ADMIN_EMAIL}`);
        await mongoose.disconnect();
        return;
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: hashed, role: 'admin' });

    console.log('✅ Admin creado:');
    console.log(`   Email:      ${ADMIN_EMAIL}`);
    console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
    console.log('\nCambia la contraseña después de entrar.');
    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
