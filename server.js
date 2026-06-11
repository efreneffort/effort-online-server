// server.js - Servidor principal de Effort Online
// Backend completo con Node.js + Express + MongoDB + Resend

require('dotenv').config();

// Forzar DNS de Google para que c-ares resuelva registros SRV de Atlas
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');
const webpush = require('web-push');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Confiar en el proxy de Railway (necesario para rate limiting y X-Forwarded-For)
app.set('trust proxy', 1);

// Middleware
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use((req, res, next) => {
    if (req.originalUrl === '/api/payments/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});
app.use(express.static(path.join(__dirname, 'public')));

// Configuración
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET no configurado — requerido para iniciar');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/effort-online';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// FROM_EMAIL: validar que el dominio tenga TLD (al menos un punto después del @)
const _rawFrom = process.env.FROM_EMAIL || '';
const _emailMatch = _rawFrom.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
const FROM_EMAIL = _emailMatch
    ? _rawFrom
    : 'Effort Online <hola@effortpozuelo.com>';

const REPLY_TO    = process.env.REPLY_TO    || 'effortentrenador@gmail.com';

// VAPID para notificaciones push — claves SOLO en variables de entorno Railway
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
if (VAPID_PUBLIC && VAPID_PRIVATE) {
    webpush.setVapidDetails(`mailto:${REPLY_TO}`, VAPID_PUBLIC, VAPID_PRIVATE);
} else {
    console.warn('⚠️  VAPID_PUBLIC / VAPID_PRIVATE no configuradas — push desactivado');
}
const ADMIN_PHONE = process.env.ADMIN_PHONE || ''; // ej: 34612345678 (sin + ni espacios)

// Inicializar Resend para envío de emails
const resend = new Resend(RESEND_API_KEY);

// Rate limiting para endpoints de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Conectar a MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('⚠️ MongoDB no disponible, usando modo memoria:', err.message));

// ============================================
// STORE EN MEMORIA (fallback sin MongoDB)
// ============================================
const memDB = { users: [] };

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

async function dbFindUser(query) {
  if (isMongoConnected()) return User.findOne(query);
  const [key, val] = Object.entries(query)[0];
  return memDB.users.find(u => u[key] === val) || null;
}

async function dbFindUserById(id) {
  if (isMongoConnected()) return User.findById(id).select('-password');
  const user = memDB.users.find(u => u._id === id);
  if (!user) return null;
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function dbCreateUser(data) {
  if (isMongoConnected()) {
    const user = new User(data);
    await user.save();
    return user;
  }
  const user = {
    ...data,
    _id: Date.now().toString(),
    role: data.role || 'client',
    isActive: true,
    createdAt: new Date()
  };
  memDB.users.push(user);
  return user;
}

async function dbListClients() {
  if (isMongoConnected()) return User.find({ role: 'client' }).select('-password');
  return memDB.users.filter(u => u.role === 'client').map(({ password: _, ...u }) => u);
}

// ============================================
// MODELOS DE BASE DE DATOS (SCHEMAS)
// ============================================

// Usuario/Cliente
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    plan: { type: String, enum: ['basico', 'premium', 'elite'], required: true },
    period: { type: String, enum: ['quarterly', 'biannual', 'annual'], required: true },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    isActive: { type: Boolean, default: true },
    subscriptionEnd: { type: Date, default: null },
    subscriptionReminderSent: { type: Boolean, default: false },
    role: { type: String, enum: ['client', 'admin'], default: 'client' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Ejercicio
const ExerciseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    muscleGroup: String,
    difficulty: { type: String, enum: ['baja', 'media', 'alta'], required: true },
    equipment: { type: String, enum: ['sin_material', 'bandas', 'pesas'], default: 'pesas' },
    description: String,
    videoUrl: String,
    createdAt: { type: Date, default: Date.now }
});

const Exercise = mongoose.model('Exercise', ExerciseSchema);

// Rutina
const ExerciseEntrySchema = {
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    sets: Number,
    reps: String,
    rest: Number,
    notes: String
};
const RoutineSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    days: [{
        name: { type: String, default: 'Día 1' },
        exercises: [ExerciseEntrySchema]
    }],
    // Campo legacy — se mantiene para compatibilidad con rutinas antiguas
    exercises: [ExerciseEntrySchema],
    updatedAt: { type: Date, default: Date.now }
});

const Routine = mongoose.model('Routine', RoutineSchema);

// Sesión de entrenamiento
const WorkoutSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    duration: { type: Number, required: true }, // en minutos
    completedAt: { type: Date, default: Date.now }
});

const WorkoutSession = mongoose.model('WorkoutSession', WorkoutSessionSchema);

// Videollamada
const VideoCallSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledFor: { type: Date, required: true },
    duration: Number,
    type: String,
    notes: String,
    completed: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false }
});

const VideoCall = mongoose.model('VideoCall', VideoCallSchema);

// Logro/Badge
const AchievementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    badgeType: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now }
});

const Achievement = mongoose.model('Achievement', AchievementSchema);

// Suscripción push
const PushSubSchema = new mongoose.Schema({
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role:         { type: String, default: 'admin' },
    subscription: { type: Object, required: true },
    createdAt:    { type: Date, default: Date.now }
});
const PushSub = mongoose.model('PushSub', PushSubSchema);

// Mensaje de chat
const MessageSchema = new mongoose.Schema({
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:         { type: String, required: true },
    sender:       { type: String, enum: ['client', 'admin'], required: true },
    readByAdmin:  { type: Boolean, default: false },
    createdAt:    { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }

        // Verificar estado del usuario en DB (isActive + subscriptionEnd)
        try {
            if (isMongoConnected()) {
                const dbUser = await User.findById(user.userId).select('isActive subscriptionEnd role');
                if (!dbUser) return res.status(401).json({ error: 'Usuario no encontrado' });
                if (!dbUser.isActive) return res.status(403).json({ error: 'Cuenta desactivada. Contacta con tu entrenador.', code: 'ACCOUNT_DISABLED' });
                if (dbUser.role === 'client' && dbUser.subscriptionEnd && new Date() > new Date(dbUser.subscriptionEnd)) {
                    return res.status(403).json({ error: 'Tu suscripción ha expirado. Contacta con tu entrenador.', code: 'SUBSCRIPTION_EXPIRED' });
                }
            }
        } catch (dbErr) {
            console.error('Error verificando usuario en DB:', dbErr);
            // En caso de error de DB, dejamos pasar (no bloqueamos por error técnico)
        }

        req.user = user;
        next();
    });
}

function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }
    next();
}

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

// Registro
app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { name, email, password, phone, plan, period } = req.body;

        if (!name || !email || !password || !plan || !period) {
            return res.status(400).json({ error: 'Todos los campos obligatorios son requeridos' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Email no válido' });
        }

        // Verificar si el usuario ya existe
        const existingUser = await dbFindUser({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const user = await dbCreateUser({
            name,
            email,
            password: hashedPassword,
            phone,
            plan,
            period
        });

        // Generar token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Enviar email de bienvenida (asíncrono, no bloquea respuesta)
        sendWelcomeEmail(user).catch(err => 
            console.error('Error enviando email bienvenida:', err)
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                period: user.period
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const user = await dbFindUser({ email });
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// ============================================
// RUTAS DE STRIPE (PAGOS)
// ============================================

// Crear Payment Intent
app.post('/api/payments/create-intent', authenticateToken, async (req, res) => {
    try {
        const { plan, period } = req.body;

        // TARIFAS 2025 FINALES (en céntimos para Stripe)
        const prices = {
            basico: { quarterly: 39900, biannual: 69900, annual: 118800 },
            premium: { quarterly: 54900, biannual: 99900, annual: 154800 },
            elite: { quarterly: 69900, biannual: 129900, annual: 190800 }
        };

        const amount = prices[plan][period];

        // Crear Payment Intent en Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'eur',
            metadata: {
                userId: req.user.userId,
                plan,
                period
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Error creando Payment Intent:', error);
        res.status(500).json({ error: 'Error al procesar el pago' });
    }
});

// Crear Checkout Session (Stripe Checkout — redirección)
app.post('/api/payments/create-checkout-session', authenticateToken, async (req, res) => {
    try {
        const { plan, period } = req.body;

        const validPlans = ['basico', 'premium', 'elite'];
        const validPeriods = ['quarterly', 'biannual', 'annual'];
        if (!validPlans.includes(plan) || !validPeriods.includes(period)) {
            return res.status(400).json({ error: 'Plan o período inválido' });
        }

        // TARIFAS 2025 FINALES (en céntimos para Stripe)
        const prices = {
            basico:   { quarterly:  39900, biannual:  69900, annual: 118800 },
            premium:  { quarterly:  54900, biannual:  99900, annual: 154800 },
            elite:    { quarterly:  69900, biannual: 129900, annual: 190800 }
        };

        const planNames   = { basico: 'Plan Básico', premium: 'Plan Premium', elite: 'Plan Élite' };
        const periodNames = { quarterly: 'Trimestral', biannual: 'Semestral', annual: 'Anual' };

        const amount  = prices[plan][period];
        const APP_URL = appBase();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `${planNames[plan]} — ${periodNames[period]}`,
                        description: 'Effort Online · Entrenamiento personal online'
                    },
                    unit_amount: amount
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${APP_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:  `${APP_URL}/cancel.html`,
            customer_email: req.user.email,
            metadata: { userId: req.user.userId, plan, period }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creando Checkout Session:', error);
        res.status(500).json({ error: 'Error al crear sesión de pago' });
    }
});

// Webhook de Stripe (confirmar pago)
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        if (!webhookSecret) {
            return res.status(400).send('Webhook secret no configurado');
        }
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (error) {
        console.error('Error verificando webhook:', error.message);
        return res.status(400).send('Webhook signature inválida');
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            if (session.payment_status === 'paid') {
                const { userId, plan, period } = session.metadata;
                const user = await User.findByIdAndUpdate(
                    userId,
                    { isActive: true, stripeCustomerId: session.customer },
                    { new: true }
                );
                if (user) {
                    const amount = (session.amount_total / 100).toFixed(0);
                    sendPaymentConfirmationEmail(user, amount, plan, period).catch(err =>
                        console.error('Error enviando email pago:', err)
                    );
                    console.log(`✅ Checkout completado para usuario ${userId} — Plan ${plan} ${period} ${amount}€`);
                }
            }
        }

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const { userId, plan, period } = paymentIntent.metadata;

            const user = await User.findByIdAndUpdate(
                userId,
                { isActive: true, stripeCustomerId: paymentIntent.customer },
                { new: true }
            );

            if (user) {
                const amount = (paymentIntent.amount / 100).toFixed(0);
                sendPaymentConfirmationEmail(user, amount, plan, period).catch(err =>
                    console.error('Error enviando email pago:', err)
                );
                console.log(`✅ Pago exitoso para usuario ${userId} — Plan ${plan} ${period} ${amount}€`);
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error procesando webhook:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// ============================================
// RUTAS DE CLIENTES
// ============================================

// Obtener datos del usuario actual
app.get('/api/user/me', authenticateToken, async (req, res) => {
    try {
        const user = await dbFindUserById(req.user.userId);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener datos del usuario' });
    }
});

// Obtener rutina del usuario
app.get('/api/user/routine', authenticateToken, async (req, res) => {
    try {
        const routine = await Routine.findOne({ userId: req.user.userId })
            .populate('days.exercises.exerciseId')
            .populate('exercises.exerciseId');
        res.json(routine);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener rutina' });
    }
});

// Registrar sesión de entrenamiento
app.post('/api/user/workout-session', authenticateToken, async (req, res) => {
    try {
        const { duration } = req.body;

        const session = new WorkoutSession({
            userId: req.user.userId,
            duration
        });

        await session.save();

        // Verificar si desbloquea algún logro
        const newBadges = await checkAndUnlockAchievements(req.user.userId);

        // Notificar a Efrén (sin bloquear la respuesta)
        const user = await User.findById(req.user.userId).select('name email plan');
        if (user) sendWorkoutNotificationToTrainer(user, duration, newBadges).catch(() => {});

        res.status(201).json({
            message: 'Sesión registrada exitosamente',
            session,
            newBadges
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar sesión' });
    }
});

// Obtener estadísticas del usuario
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Sesiones este mes
        const sessionsThisMonth = await WorkoutSession.countDocuments({
            userId,
            completedAt: { $gte: startOfMonth }
        });

        // Total de horas
        const totalSessions = await WorkoutSession.find({ userId });
        const totalHours = totalSessions.reduce((sum, s) => sum + s.duration, 0) / 60;

        // Racha actual
        const streak = await calculateStreak(userId);

        // Logros desbloqueados
        const achievements = await Achievement.countDocuments({ userId });

        res.json({
            sessionsThisMonth,
            totalHours: totalHours.toFixed(1),
            currentStreak: streak,
            achievementsUnlocked: achievements
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// Historial de sesiones del usuario
app.get('/api/user/sessions', authenticateToken, async (req, res) => {
    try {
        const sessions = await WorkoutSession.find({ userId: req.user.userId })
            .sort({ completedAt: -1 })
            .limit(20);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener sesiones' });
    }
});

// Obtener logros
app.get('/api/user/achievements', authenticateToken, async (req, res) => {
    try {
        const achievements = await Achievement.find({ userId: req.user.userId });
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener logros' });
    }
});

// ============================================
// RUTAS DE ADMIN
// ============================================

// Listar todos los clientes
app.get('/api/admin/clients', authenticateToken, isAdmin, async (req, res) => {
    try {
        const clients = await dbListClients();
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// Activar / Desactivar cliente
app.put('/api/admin/clients/:clientId/toggle-active', authenticateToken, isAdmin, async (req, res) => {
    try {
        const client = await User.findById(req.params.clientId);
        if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
        client.isActive = !client.isActive;
        await client.save();
        res.json({ isActive: client.isActive });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

// Actualizar fecha de fin de suscripción
app.put('/api/admin/clients/:clientId/subscription-end', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { subscriptionEnd } = req.body;
        const client = await User.findByIdAndUpdate(
            req.params.clientId,
            { subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : null, subscriptionReminderSent: false },
            { new: true }
        ).select('-password');
        if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json({ subscriptionEnd: client.subscriptionEnd });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar suscripción' });
    }
});

// Eliminar cliente y todos sus datos
app.delete('/api/admin/clients/:clientId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { clientId } = req.params;
        const client = await User.findById(clientId);
        if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

        // Borrar todos los datos asociados
        await Promise.all([
            Achievement.deleteMany({ userId: clientId }),
            WorkoutSession.deleteMany({ userId: clientId }),
            VideoCall.deleteMany({ userId: clientId }),
            Routine.deleteOne({ userId: clientId }),
            User.findByIdAndDelete(clientId)
        ]);

        res.json({ message: `Cliente ${client.name} eliminado correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

// Obtener sesiones de un cliente agrupadas por mes (admin)
app.get('/api/admin/clients/:clientId/sessions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const sessions = await WorkoutSession.find({ userId: req.params.clientId })
            .sort({ completedAt: -1 });

        // Agrupar por mes
        const grouped = {};
        sessions.forEach(s => {
            const d = new Date(s.completedAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            if (!grouped[key]) grouped[key] = { label, sessions: [], totalMinutes: 0 };
            grouped[key].sessions.push({ date: s.completedAt, duration: s.duration });
            grouped[key].totalMinutes += s.duration || 0;
        });

        res.json({ total: sessions.length, months: grouped });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener sesiones' });
    }
});

// Obtener rutina de un cliente (admin)
app.get('/api/admin/clients/:clientId/routine', authenticateToken, isAdmin, async (req, res) => {
    try {
        const routine = await Routine.findOne({ userId: req.params.clientId })
            .populate('days.exercises.exerciseId')
            .populate('exercises.exerciseId');
        res.json(routine || null);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener rutina' });
    }
});

// Actualizar rutina de un cliente
app.put('/api/admin/clients/:clientId/routine', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { clientId } = req.params;
        const { days } = req.body;

        let routine = await Routine.findOne({ userId: clientId });

        if (routine) {
            routine.days = days;
            routine.updatedAt = new Date();
            await routine.save();
        } else {
            routine = new Routine({ userId: clientId, days });
            await routine.save();
        }

        res.json({ message: 'Rutina actualizada exitosamente', routine });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar rutina' });
    }
});

// Crear ejercicio
app.post('/api/admin/exercises', authenticateToken, isAdmin, async (req, res) => {
    try {
        const exercise = new Exercise(req.body);
        await exercise.save();
        res.status(201).json(exercise);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear ejercicio' });
    }
});

// Listar ejercicios (filtrable por equipment con ?equipment=sin_material|bandas|pesas)
app.get('/api/admin/exercises', authenticateToken, async (req, res) => {
    try {
        const filter = req.query.equipment ? { equipment: req.query.equipment } : {};
        const exercises = await Exercise.find(filter).sort({ equipment: 1, category: 1, name: 1 });
        res.json(exercises);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener ejercicios' });
    }
});

// Editar ejercicio (nombre + videoUrl)
app.put('/api/admin/exercises/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, videoUrl } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Nombre requerido' });
        const update = { name: name.trim() };
        if (videoUrl !== undefined) update.videoUrl = videoUrl || null;
        const exercise = await Exercise.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!exercise) return res.status(404).json({ error: 'Ejercicio no encontrado' });
        res.json(exercise);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar ejercicio' });
    }
});

// Eliminar ejercicio
app.delete('/api/admin/exercises/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const exercise = await Exercise.findByIdAndDelete(req.params.id);
        if (!exercise) return res.status(404).json({ error: 'Ejercicio no encontrado' });
        res.json({ message: 'Ejercicio eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar ejercicio' });
    }
});

// Editar videollamada
app.put('/api/admin/videocalls/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const call = await VideoCall.findByIdAndUpdate(
            req.params.id,
            { ...req.body, reminderSent: false },
            { new: true }
        );
        if (!call) return res.status(404).json({ error: 'Llamada no encontrada' });
        res.json(call);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar llamada' });
    }
});

// Eliminar videollamada
app.delete('/api/admin/videocalls/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const call = await VideoCall.findByIdAndDelete(req.params.id);
        if (!call) return res.status(404).json({ error: 'Llamada no encontrada' });
        res.json({ message: 'Llamada eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar llamada' });
    }
});

// Agendar videollamada
app.post('/api/admin/videocalls', authenticateToken, isAdmin, async (req, res) => {
    try {
        const videoCall = new VideoCall(req.body);
        await videoCall.save();

        // Enviar confirmación inmediata al cliente
        const client = await User.findById(videoCall.userId).select('name email isActive');
        if (client && client.isActive) {
            const typeLabel = { seguimiento: 'Seguimiento', evaluacion: 'Evaluación Inicial', revision: 'Revisión de Rutina' }[videoCall.type] || videoCall.type;
            sendVideoCallConfirmationEmail(client, videoCall.scheduledFor, typeLabel, videoCall.duration || 30)
                .catch(err => console.error('Error enviando confirmación videollamada:', err));
        }

        res.status(201).json(videoCall);
    } catch (error) {
        res.status(500).json({ error: 'Error al agendar videollamada' });
    }
});

// Listar videollamadas
app.get('/api/admin/videocalls', authenticateToken, isAdmin, async (req, res) => {
    try {
        const videoCalls = await VideoCall.find()
            .populate('userId', 'name email plan')
            .sort({ scheduledFor: 1 });
        res.json(videoCalls);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener videollamadas' });
    }
});

// Videollamadas del usuario autenticado
app.get('/api/user/videocalls', authenticateToken, async (req, res) => {
    try {
        const calls = await VideoCall.find({ userId: req.user.userId })
            .sort({ scheduledFor: 1 });
        res.json(calls);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener videollamadas' });
    }
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================

// Clave pública VAPID (para el frontend)
app.get('/api/push/vapid-public', (req, res) => {
    if (!VAPID_PUBLIC) return res.status(503).json({ error: 'Push no configurado' });
    res.json({ key: VAPID_PUBLIC });
});

// Guardar suscripción push
app.post('/api/push/subscribe', authenticateToken, async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription) return res.status(400).json({ error: 'Suscripción requerida' });
        // Upsert: si ya existe para este userId, actualizar
        await PushSub.findOneAndUpdate(
            { userId: req.user.userId },
            { userId: req.user.userId, role: req.user.role, subscription },
            { upsert: true, new: true }
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Error guardando suscripción' });
    }
});

// Eliminar suscripción
app.delete('/api/push/subscribe', authenticateToken, async (req, res) => {
    await PushSub.deleteOne({ userId: req.user.userId });
    res.json({ ok: true });
});

// Enviar notificación push a todos los admins
async function sendPushToAdmins(title, body, data = {}) {
    try {
        const subs = await PushSub.find({ role: 'admin' });
        const payload = JSON.stringify({ title, body, data });
        await Promise.all(subs.map(s =>
            webpush.sendNotification(s.subscription, payload)
                .catch(async err => {
                    // Si el endpoint ya no existe, borrar suscripción
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await PushSub.deleteOne({ _id: s._id });
                    }
                })
        ));
    } catch (err) {
        console.error('Error enviando push:', err.message);
    }
}

// ============================================
// CHAT
// ============================================

// Cliente: obtener su conversación
app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        const messages = await Message.find({ userId: req.user.userId })
            .sort({ createdAt: 1 }).limit(200);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
});

// Cliente: enviar mensaje
app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

        const msg = await new Message({
            userId: req.user.userId,
            text:   text.trim(),
            sender: 'client'
        }).save();

        // Push + email al admin
        const user = await User.findById(req.user.userId).select('name plan');

        // Push notification inmediata
        sendPushToAdmins(
            `💬 ${user?.name || 'Cliente'}`,
            text.trim().slice(0, 100),
            { url: '/admin.html', clientId: req.user.userId }
        ).catch(() => {});

        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hola@effortpozuelo.com';
        resend.emails.send({
            from: FROM_EMAIL, to: ADMIN_EMAIL, replyTo: REPLY_TO,
            subject: `💬 Nuevo mensaje de ${user?.name || 'un cliente'}`,
            html: `<div style="font-family:sans-serif;padding:1.5rem">
                <p><strong>${user?.name || 'Cliente'}</strong> (${(user?.plan||'').toUpperCase()}) te ha enviado un mensaje:</p>
                <blockquote style="border-left:4px solid #00D9A3;padding:0.8rem 1.2rem;background:#f0fff4;border-radius:4px;margin:1rem 0">
                    ${text.trim()}
                </blockquote>
                <a href="${appBase()}/admin.html" style="background:#001F54;color:white;padding:0.7rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:700">Ver en el panel admin</a>
                ${emailFooter()}
            </div>`
        }).catch(() => {});

        res.status(201).json(msg);
    } catch (err) {
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
});

// Admin: lista de clientes con mensajes (y nº no leídos)
app.get('/api/admin/messages', authenticateToken, isAdmin, async (req, res) => {
    try {
        const unread = await Message.aggregate([
            { $match: { sender: 'client', readByAdmin: false } },
            { $group: { _id: '$userId', count: { $sum: 1 }, last: { $max: '$createdAt' } } }
        ]);
        const clientIds = [...new Set([
            ...unread.map(u => u._id.toString()),
            ...(await Message.distinct('userId'))
        ])];
        const clients = await User.find({ _id: { $in: clientIds } }).select('name plan');
        const unreadMap = Object.fromEntries(unread.map(u => [u._id.toString(), u.count]));
        res.json(clients.map(c => ({ ...c.toObject(), unread: unreadMap[c._id.toString()] || 0 })));
    } catch (err) {
        res.status(500).json({ error: 'Error' });
    }
});

// Admin: conversación con un cliente
app.get('/api/admin/messages/:clientId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const messages = await Message.find({ userId: req.params.clientId })
            .sort({ createdAt: 1 }).limit(200);
        // Marcar como leídos
        await Message.updateMany({ userId: req.params.clientId, sender: 'client', readByAdmin: false }, { readByAdmin: true });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Error' });
    }
});

// Admin: responder a un cliente
app.post('/api/admin/messages/:clientId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ error: 'Mensaje vacío' });
        const msg = await new Message({
            userId: req.params.clientId,
            text:   text.trim(),
            sender: 'admin'
        }).save();
        res.status(201).json(msg);
    } catch (err) {
        res.status(500).json({ error: 'Error al enviar respuesta' });
    }
});

// Estadísticas generales del negocio
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const totalClients = await User.countDocuments({ role: 'client', isActive: true });
        
        // Calcular ingresos mensuales con TARIFAS 2025 FINALES
        const clients = await User.find({ role: 'client', isActive: true });
        const monthlyRevenue = clients.reduce((sum, client) => {
            const prices = {
                basico: { monthly: 149, quarterly: 133, biannual: 116, annual: 99 },
                premium: { monthly: 199, quarterly: 183, biannual: 166, annual: 129 },
                elite: { monthly: 249, quarterly: 233, biannual: 216, annual: 159 }
            };
            return sum + prices[client.plan][client.period];
        }, 0);

        // Videollamadas hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const callsToday = await VideoCall.countDocuments({
            scheduledFor: { $gte: today, $lt: tomorrow }
        });

        res.json({
            totalClients,
            monthlyRevenue,
            callsToday,
            retentionRate: 94 // Esto se calcularía con más lógica
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Calcular racha actual del usuario
async function calculateStreak(userId) {
    const sessions = await WorkoutSession.find({ userId })
        .sort({ completedAt: -1 })
        .limit(30);

    if (sessions.length === 0) return 0;

    let streak = 1;
    let currentDate = new Date(sessions[0].completedAt);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < sessions.length; i++) {
        const sessionDate = new Date(sessions[i].completedAt);
        sessionDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            streak++;
            currentDate = sessionDate;
        } else if (diffDays > 1) {
            break;
        }
    }

    return streak;
}

// Verificar y desbloquear logros — devuelve array con los nuevos desbloqueados
async function checkAndUnlockAchievements(userId) {
    const sessions = await WorkoutSession.find({ userId });
    const achievements = await Achievement.find({ userId });
    const unlockedTypes = achievements.map(a => a.badgeType);
    const newBadges = [];

    async function unlock(type) {
        if (!unlockedTypes.includes(type)) {
            await new Achievement({ userId, badgeType: type }).save();
            newBadges.push(type);
        }
    }

    const total = sessions.length;
    const now   = new Date();

    // ── Primer Paso ───────────────────────────────────────────
    if (total >= 1) await unlock('first_step');

    // ── Semana Activa: 3 sesiones en los últimos 7 días ───────
    const since7 = new Date(now - 7 * 24 * 3600 * 1000);
    const sessionsLast7 = sessions.filter(s => new Date(s.completedAt) >= since7).length;
    if (sessionsLast7 >= 3) await unlock('weekly_active');

    // ── Constante: mínimo 2 sesiones por semana durante 4 semanas seguidas ──
    const committed = (() => {
        for (let w = 0; w < 4; w++) {
            // Lunes de la semana w (0 = semana actual)
            const mon = new Date(now);
            mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) - w * 7);
            mon.setHours(0, 0, 0, 0);
            const sun = new Date(mon); sun.setDate(mon.getDate() + 7);
            const count = sessions.filter(s => { const d = new Date(s.completedAt); return d >= mon && d < sun; }).length;
            if (count < 2) return false;
        }
        return true;
    })();
    if (committed) await unlock('committed');

    // ── Mes de Hierro: 12 sesiones en el mes actual ───────────
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sessionsThisMonth = sessions.filter(s => new Date(s.completedAt) >= startOfMonth).length;
    if (sessionsThisMonth >= 12) await unlock('monthly_active');

    // ── Guerrero: una sesión de 60 min o más ─────────────────
    if (sessions.some(s => s.duration >= 60)) await unlock('warrior');

    // ── Ironman: 50 horas totales (3000 min) ─────────────────
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    if (totalMinutes >= 3000) await unlock('ironman');

    // ── Centurión: 100 sesiones totales ──────────────────────
    if (total >= 100) await unlock('centurion');

    // ── Logros de Timer ───────────────────────────────────────
    if (total >= 1)  await unlock('timer_1');
    if (total >= 5)  await unlock('timer_5');
    if (total >= 10) await unlock('timer_10');
    if (total >= 25) await unlock('timer_25');
    if (total >= 50) await unlock('timer_50');

    return newBadges;
}

// ============================================
// FUNCIONES DE ENVÍO DE EMAILS (RESEND)
// ============================================

// ── Notificación a Efrén cuando un cliente termina el timer ──
const BADGE_NAME = {
    first_step:     'Primer Paso',
    weekly_active:  'Semana Activa',
    committed:      'Constante',
    monthly_active: 'Mes de Hierro',
    warrior:        'Guerrero',
    ironman:        'Ironman',
    centurion:      'Centurión',
    timer_1:        'Ignición',
    timer_5:        'En Marcha',
    timer_10:       'Disciplinado',
    timer_25:       'Atleta',
    timer_50:       'Máquina',
};

// ── Helper: pie de email con links clicables ─────────────────────────────────
function emailFooter() {
    const phone = ADMIN_PHONE ? ADMIN_PHONE.replace(/^34/, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : '609 539 485';
    const waHref = ADMIN_PHONE ? `https://wa.me/${ADMIN_PHONE}` : `tel:${phone}`;
    return `
        <div style="background:#f8f9fa;padding:1.2rem;text-align:center;color:#999;font-size:0.82rem">
            <p style="margin:0">
                <a href="mailto:${REPLY_TO}" style="color:#999;text-decoration:none">${REPLY_TO}</a>
                &nbsp;|&nbsp;
                <a href="${waHref}" style="color:#999;text-decoration:none">📱 ${phone}</a>
            </p>
            <p style="margin:0.4rem 0 0;color:#bbb;font-size:0.78rem">Effort Online · Tu entrenador personal online</p>
        </div>`;
}

// ── Helper: base URL de la app ────────────────────────────────────────────────
function appBase() {
    return (process.env.APP_URL || 'https://app.effortpozuelo.com').replace(/\/$/, '');
}

async function sendWorkoutNotificationToTrainer(user, duration, newBadges = []) {
    try {
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hola@effortpozuelo.com';
        const planNames   = { basico: 'Básico', premium: 'Premium', elite: 'Élite' };
        const planLabel   = planNames[user.plan] || user.plan;
        const mins        = Number(duration);
        const TZ          = { timeZone: 'Europe/Madrid' };
        const hora        = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', ...TZ });
        const fecha       = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', ...TZ });

        const badgeRows = newBadges.length
            ? `<p style="margin:1rem 0 0.3rem;font-weight:600;color:#001F54;">Logros desbloqueados:</p>
               <ul style="margin:0;padding-left:1.2rem;color:#444;">
                 ${newBadges.map(b => `<li>${BADGE_NAME[b] || b}</li>`).join('')}
               </ul>`
            : '';

        await resend.emails.send({
            from:    FROM_EMAIL,
            to:      ADMIN_EMAIL,
            replyTo: user.email,
            subject: `Entreno completado — ${user.name} (${mins} min)`,
            html: `
            <!DOCTYPE html><html><head><meta charset="utf-8"></head>
            <body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:16px;">
              <div style="max-width:520px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <div style="background:#001F54;padding:1.5rem 2rem;text-align:center;">
                  <p style="color:#00D9A3;font-size:1.4rem;font-weight:800;margin:0;letter-spacing:-0.02em;">effort<span style="color:white;">.</span></p>
                </div>
                <div style="padding:2rem;">
                  <div style="background:#e8f8f5;border-left:4px solid #00D9A3;border-radius:6px;padding:1rem 1.2rem;margin-bottom:1.5rem;">
                    <p style="margin:0;color:#001F54;font-weight:700;font-size:1.05rem;">Entreno completado</p>
                    <p style="margin:0.3rem 0 0;color:#555;font-size:0.9rem;">${fecha} a las ${hora}</p>
                  </div>
                  <table style="width:100%;border-collapse:collapse;font-size:0.92rem;">
                    <tr><td style="padding:0.4rem 0;color:#888;width:110px;">Cliente</td><td style="padding:0.4rem 0;font-weight:600;color:#001F54;">${user.name}</td></tr>
                    <tr><td style="padding:0.4rem 0;color:#888;">Email</td><td style="padding:0.4rem 0;color:#333;">${user.email}</td></tr>
                    <tr><td style="padding:0.4rem 0;color:#888;">Plan</td><td style="padding:0.4rem 0;color:#333;">${planLabel}</td></tr>
                    <tr><td style="padding:0.4rem 0;color:#888;">Duración</td><td style="padding:0.4rem 0;font-weight:600;color:#00D9A3;font-size:1.1rem;">${mins} minutos</td></tr>
                  </table>
                  ${badgeRows}
                </div>
                <div style="background:#f8f9fb;padding:0.8rem 2rem;text-align:center;font-size:0.8rem;color:#999;">
                  Effort Online · Notificación automática
                </div>
              </div>
            </body></html>`
        });

        console.log(`📬 Notificación entreno enviada: ${user.name} (${mins} min)`);
    } catch (err) {
        console.error('❌ Error notificación entreno:', err.message);
    }
}

// Email de bienvenida al registrarse
async function sendWelcomeEmail(user) {
    try {
        const planNames = {
            basico: 'BÁSICO',
            premium: 'PREMIUM',
            elite: 'ÉLITE'
        };

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            replyTo: REPLY_TO,
            subject: '¡Bienvenido a Effort Online! 💪',
            html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0 16px; background: #f5f5f5; box-sizing: border-box;">
                    <div style="max-width: 600px; width: 100%; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #001F54 0%, #003580 100%); padding: 2rem; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 2rem;">
                                <span style="color: #00D9A3;">e</span><span style="color: white;">ff</span><span style="color: #00D9A3;">ort</span>
                            </h1>
                            <p style="color: #00D9A3; margin: 0.5rem 0 0; font-size: 0.9rem;">ASESORÍAS ONLINE</p>
                        </div>

                        <!-- Contenido -->
                        <div style="padding: 2rem;">
                            <h2 style="color: #001F54; margin-top: 0;">¡Hola ${user.name}! 👋</h2>

                            <p style="color: #444; line-height: 1.6; font-size: 1rem;">
                                Bienvenido a <strong>Effort Online</strong>. Me alegra mucho que hayas decidido dar el paso hacia una vida más activa y saludable.
                            </p>

                            <div style="background: #f8f9fa; border-left: 4px solid #00D9A3; padding: 1rem 1.5rem; margin: 1.5rem 0; border-radius: 8px;">
                                <p style="margin: 0; color: #001F54;">
                                    <strong>Tu plan activo:</strong> ${planNames[user.plan]}
                                </p>
                            </div>

                            <h3 style="color: #001F54; margin-top: 2rem;">🎯 Próximos pasos:</h3>
                            <ol style="color: #444; line-height: 1.8;">
                                <li>Accede a tu <strong>área de cliente</strong></li>
                                <li>Me pondré en contacto contigo para agendar una <strong>videollamada inicial</strong></li>
                                <li>Tras conocernos, recibirás tu <strong>rutina personalizada</strong></li>
                                <li>¡Empieza a entrenar!</li>
                            </ol>

                            <div style="text-align: center; margin: 2rem 0;">
                                <a href="${appBase()}/login.html" style="display: inline-block; background: #00D9A3; color: #001F54; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; max-width: 100%; box-sizing: border-box;">
                                    Acceder a mi cuenta
                                </a>
                            </div>
                            
                            <p style="color: #666; line-height: 1.6; font-size: 0.95rem;">
                                Si tienes cualquier duda, no dudes en escribirme.
                            </p>
                            
                            <p style="color: #001F54; margin-top: 2rem;">
                                <strong>¡Vamos a por ello! 💪</strong><br>
                                <span style="color: #00D9A3;">Efrén</span>
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        ${emailFooter()}
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Error enviando email bienvenida:', error);
            return false;
        }

        console.log('✅ Email de bienvenida enviado a:', user.email);
        return true;
    } catch (error) {
        console.error('Error en sendWelcomeEmail:', error);
        return false;
    }
}

// Email de recuperación de contraseña
async function sendPasswordResetEmail(email, resetToken) {
    try {
        const appBase = (process.env.APP_URL || 'https://app.effortpozuelo.com').replace(/\/$/, '');
        const resetUrl = `${appBase}/reset-password.html?token=${resetToken}`;

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            replyTo: REPLY_TO,
            subject: '🔐 Recuperar contraseña - Effort Online',
            html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0 16px; background: #f5f5f5; box-sizing: border-box;">
                    <div style="max-width: 600px; width: 100%; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="background: linear-gradient(135deg, #001F54 0%, #003580 100%); padding: 2rem; text-align: center;">
                            <h1 style="color: white; margin: 0;">🔐 Recuperar Contraseña</h1>
                        </div>
                        
                        <div style="padding: 2rem;">
                            <p style="color: #444; line-height: 1.6;">Hola,</p>
                            
                            <p style="color: #444; line-height: 1.6;">
                                Hemos recibido una solicitud para restablecer tu contraseña en <strong>Effort Online</strong>.
                            </p>
                            
                            <div style="text-align: center; margin: 2rem 0;">
                                <a href="${resetUrl}" style="display: inline-block; background: #00D9A3; color: #001F54; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; max-width: 100%; box-sizing: border-box;">
                                    Restablecer contraseña
                                </a>
                            </div>
                            
                            <p style="color: #666; line-height: 1.6; font-size: 0.9rem;">
                                Si el botón no funciona, pulsa este enlace:<br>
                                <a href="${resetUrl}" style="color: #00897B; word-break: break-all; font-size: 0.85rem;">${resetUrl}</a>
                            </p>

                            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem 1.5rem; margin: 1.5rem 0; border-radius: 8px;">
                                <p style="margin: 0; color: #856404; font-size: 0.9rem;">
                                    ⚠️ Este enlace expira en <strong>1 hora</strong>.<br>
                                    Si no solicitaste este cambio, ignora este email.
                                </p>
                            </div>

                            <p style="color: #001F54; margin-top: 2rem;">
                                <strong>Effort Online</strong><br>
                                <span style="color: #00D9A3;">Efrén</span>
                            </p>
                        </div>

                        ${emailFooter()}
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Error enviando email recuperación:', error);
            return false;
        }

        console.log('✅ Email de recuperación enviado a:', email);
        return true;
    } catch (error) {
        console.error('Error en sendPasswordResetEmail:', error);
        return false;
    }
}

// Email de confirmación de pago
async function sendPaymentConfirmationEmail(user, amount, plan, period) {
    try {
        const planNames = {
            basico: 'BÁSICO',
            premium: 'PREMIUM',
            elite: 'ÉLITE'
        };

        const periodNames = {
            monthly: 'Mensual',
            quarterly: 'Trimestral',
            biannual: 'Semestral',
            annual: 'Anual'
        };

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            replyTo: REPLY_TO,
            subject: '✅ Pago confirmado - Effort Online',
            html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0 16px; background: #f5f5f5; box-sizing: border-box;">
                    <div style="max-width: 600px; width: 100%; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="background: linear-gradient(135deg, #00D9A3 0%, #00b389 100%); padding: 2rem; text-align: center;">
                            <h1 style="color: #001F54; margin: 0;">✅ Pago Confirmado</h1>
                        </div>
                        
                        <div style="padding: 2rem;">
                            <p style="color: #444; line-height: 1.6; font-size: 1.1rem;">Hola ${user.name},</p>
                            
                            <p style="color: #444; line-height: 1.6;">
                                ¡Tu pago se ha procesado correctamente! Ya puedes acceder a tu área de cliente.
                            </p>
                            
                            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0;">
                                <h3 style="color: #001F54; margin-top: 0;">📋 Detalles del pago:</h3>
                                <table style="width: 100%; color: #444;">
                                    <tr>
                                        <td style="padding: 0.5rem 0;"><strong>Plan:</strong></td>
                                        <td style="padding: 0.5rem 0; text-align: right;">${planNames[plan]}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 0.5rem 0;"><strong>Periodicidad:</strong></td>
                                        <td style="padding: 0.5rem 0; text-align: right;">${periodNames[period]}</td>
                                    </tr>
                                    <tr style="border-top: 2px solid #ddd;">
                                        <td style="padding: 0.75rem 0;"><strong>Total pagado:</strong></td>
                                        <td style="padding: 0.75rem 0; text-align: right; color: #00D9A3; font-size: 1.2rem;"><strong>${amount}€</strong></td>
                                    </tr>
                                </table>
                            </div>
                            
                            <p style="color: #444; line-height: 1.6;">
                                En las próximas 24-48h recibirás tu <strong>rutina personalizada</strong>.
                            </p>
                            
                            <div style="text-align: center; margin: 2rem 0;">
                                <a href="${appBase()}/dashboard.html" style="display: inline-block; background: #00D9A3; color: #001F54; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; max-width: 100%; box-sizing: border-box;">
                                    Acceder a mi dashboard
                                </a>
                            </div>
                            
                            <p style="color: #001F54; margin-top: 2rem;">
                                ¡Gracias por confiar en Effort! 💪<br>
                                <span style="color: #00D9A3;">Efrén</span>
                            </p>
                        </div>
                        
                        ${emailFooter()}
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Error enviando email pago:', error);
            return false;
        }

        console.log('✅ Email de confirmación enviado a:', user.email);
        return true;
    } catch (error) {
        console.error('Error en sendPaymentConfirmationEmail:', error);
        return false;
    }
}

// Email de recordatorio de videollamada
// Email de CONFIRMACIÓN inmediata al agendar videollamada
async function sendVideoCallConfirmationEmail(user, callDate, callType, duration) {
    try {
        const dt = new Date(callDate);
        const fecha = dt.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' });
        const hora  = dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            replyTo: REPLY_TO,
            subject: `📅 Videollamada confirmada — ${fecha}`,
            html: `
                <!DOCTYPE html><html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
                <body style="font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0 16px;background:#f5f5f5;box-sizing:border-box">
                    <div style="max-width:560px;width:100%;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1)">
                        <div style="background:linear-gradient(135deg,#001F54 0%,#003580 100%);padding:2rem;text-align:center">
                            <div style="font-size:1.8rem;font-weight:800;color:white;letter-spacing:-0.03em">effort<span style="color:#00D9A3">.</span></div>
                            <p style="color:#00D9A3;margin:0.3rem 0 0;font-size:0.9rem">VIDEOLLAMADA CONFIRMADA</p>
                        </div>
                        <div style="padding:2rem">
                            <p style="color:#001F54;font-size:1.05rem;font-weight:700;margin-bottom:0.5rem">Hola ${user.name.split(' ')[0]} 👋</p>
                            <p style="color:#444;line-height:1.6;margin-bottom:1.5rem">Tu videollamada con Efrén ha quedado confirmada:</p>
                            <div style="background:#f0fff4;border-left:4px solid #00D9A3;border-radius:8px;padding:1.2rem 1.5rem;margin-bottom:1.5rem">
                                <p style="margin:0 0 0.4rem;color:#001F54;font-weight:700">📞 ${callType}</p>
                                <p style="margin:0 0 0.2rem;color:#444">📅 ${fecha}</p>
                                <p style="margin:0 0 0.2rem;color:#444">🕐 ${hora}</p>
                                <p style="margin:0;color:#444">⏱ ${duration} minutos</p>
                            </div>
                            <p style="color:#555;line-height:1.6;font-size:0.92rem">Te enviaré el enlace de la videollamada por WhatsApp <strong>15 minutos antes</strong> de la hora.</p>
                            <p style="color:#001F54;margin-top:2rem">¡Nos vemos pronto! 💪<br><span style="color:#00D9A3">Efrén</span></p>
                        </div>
                        ${emailFooter()}
                    </div>
                </body></html>
            `
        });
        if (error) { console.error('Error enviando confirmación llamada:', error); return false; }
        console.log(`✅ Confirmación videollamada enviada a ${user.email}`);
        return true;
    } catch (err) {
        console.error('Error en sendVideoCallConfirmationEmail:', err);
        return false;
    }
}

// Email de RECORDATORIO el día anterior
async function sendVideoCallReminderEmail(user, callDate, callType) {
    try {
        const formattedDate = new Date(callDate).toLocaleString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Madrid'
        });

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            replyTo: REPLY_TO,
            subject: '📅 Recordatorio: Videollamada mañana',
            html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0 16px; background: #f5f5f5; box-sizing: border-box;">
                    <div style="max-width: 600px; width: 100%; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="background: linear-gradient(135deg, #001F54 0%, #003580 100%); padding: 2rem; text-align: center;">
                            <h1 style="color: white; margin: 0;">📅 Recordatorio Videollamada</h1>
                        </div>
                        
                        <div style="padding: 2rem;">
                            <p style="color: #444; line-height: 1.6;">Hola ${user.name},</p>
                            
                            <p style="color: #444; line-height: 1.6;">
                                Te recuerdo que tenemos videollamada programada:
                            </p>
                            
                            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0; border-left: 4px solid #00D9A3;">
                                <p style="margin: 0 0 0.5rem; color: #001F54;"><strong>📞 ${callType}</strong></p>
                                <p style="margin: 0; color: #444; font-size: 1.1rem;">${formattedDate}</p>
                            </div>
                            
                            <p style="color: #444; line-height: 1.6;">
                                Te enviaré el enlace de la videollamada por WhatsApp 15 minutos antes.
                            </p>
                            
                            <p style="color: #001F54; margin-top: 2rem;">
                                ¡Nos vemos pronto! 💪<br>
                                <span style="color: #00D9A3;">Efrén</span>
                            </p>
                        </div>
                        
                        ${emailFooter()}
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Error enviando recordatorio:', error);
            return false;
        }

        console.log('✅ Recordatorio enviado a:', user.email);
        return true;
    } catch (error) {
        console.error('Error en sendVideoCallReminderEmail:', error);
        return false;
    }
}

// ============================================
// ENDPOINTS DE EMAILS
// ============================================

// Endpoint: Solicitar recuperación de contraseña
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email requerido' });
        }

        // Buscar usuario
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'Este email no está registrado. ¿Quizás usaste otro al registrarte?' });
        }

        // Generar token temporal (1 hora)
        const resetToken = jwt.sign(
            { userId: user._id, purpose: 'password-reset' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Enviar email
        const emailSent = await sendPasswordResetEmail(email, resetToken);

        if (!emailSent) {
            console.error('❌ Falló el envío del email de recuperación a:', email);
            return res.status(500).json({ error: 'No se pudo enviar el email. Contacta con soporte.' });
        }

        res.json({
            message: 'Email enviado correctamente'
        });
    } catch (error) {
        console.error('Error en forgot-password:', error);
        res.status(500).json({ error: 'Error al procesar solicitud' });
    }
});

// Endpoint: Restablecer contraseña con token
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token y contraseña requeridos' });
        }

        // Verificar token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        if (decoded.purpose !== 'password-reset') {
            return res.status(401).json({ error: 'Token inválido' });
        }

        // Actualizar contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(decoded.userId, { password: hashedPassword });

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error en reset-password:', error);
        res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
    const mongoOk = isMongoConnected();
    res.json({
        status: 'ok',
        db: mongoOk ? 'mongodb' : 'memory',
        usersInMemory: mongoOk ? null : memDB.users.length
    });
});

// ============================================
// JOB DIARIO: RECORDATORIO DE SUSCRIPCIÓN
// ============================================

async function checkSubscriptionReminders() {
    if (!isMongoConnected()) return;
    try {
        const now = new Date();
        // Ventana: entre 13 y 16 días desde hoy (cubre reinicios del servidor)
        const from = new Date(now); from.setDate(now.getDate() + 13);
        const to   = new Date(now); to.setDate(now.getDate() + 16);

        const clients = await User.find({
            role: 'client',
            isActive: true,
            subscriptionReminderSent: false,
            subscriptionEnd: { $gte: from, $lte: to }
        });

        for (const client of clients) {
            const daysLeft = Math.ceil((new Date(client.subscriptionEnd) - now) / 86400000);
            const endFormatted = new Date(client.subscriptionEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' });

            await resend.emails.send({
                from: FROM_EMAIL,
                to: client.email,
                replyTo: REPLY_TO,
                subject: `⏳ Tu suscripción Effort vence en ${daysLeft} días`,
                html: `
                    <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#001030;border-radius:16px;overflow:hidden">
                        <div style="padding:2rem;text-align:center;background:#001F54">
                            <div style="font-size:1.8rem;font-weight:800;color:white;letter-spacing:-0.03em">
                                effort<span style="color:#00D9A3">.</span>
                            </div>
                        </div>
                        <div style="padding:2rem;background:white;border-radius:0 0 16px 16px">
                            <p style="color:#001F54;font-size:1.1rem;font-weight:700;margin-bottom:0.5rem">
                                Hola ${client.name.split(' ')[0]} 👋
                            </p>
                            <p style="color:#444;line-height:1.6;margin-bottom:1rem">
                                Te escribimos para recordarte que tu suscripción a <strong>Effort Online</strong>
                                vence el <strong>${endFormatted}</strong> — quedan <strong>${daysLeft} días</strong>.
                            </p>
                            <div style="background:#f0fff4;border-left:4px solid #00D9A3;border-radius:8px;padding:1rem 1.2rem;margin-bottom:1.5rem">
                                <p style="margin:0;color:#276749;font-size:0.95rem">
                                    Para renovar tu plan y no perder el acceso, contacta con Efrén.
                                </p>
                            </div>
                            <a href="${ADMIN_PHONE ? 'https://wa.me/' + ADMIN_PHONE : 'mailto:' + REPLY_TO}"
                               style="display:inline-block;background:#00D9A3;color:#001F54;font-weight:700;padding:0.85rem 2rem;border-radius:10px;text-decoration:none;font-size:1rem">
                                Contactar con Efrén
                            </a>
                            <p style="color:#999;font-size:0.82rem;margin-top:2rem">
                                Effort Online · Tu entrenador personal online
                            </p>
                        </div>
                    </div>
                `
            });

            client.subscriptionReminderSent = true;
            await client.save();
            console.log(`📧 Recordatorio enviado a ${client.email} (vence ${endFormatted})`);
        }

        if (clients.length === 0) {
            console.log('📅 Recordatorios suscripción: ningún cliente vence en ~15 días');
        }

        // ── Recordatorios de videollamadas (mañana) ──────────────────────────
        const tomorrowStart = new Date(now); tomorrowStart.setDate(now.getDate() + 1); tomorrowStart.setHours(0, 0, 0, 0);
        const tomorrowEnd   = new Date(tomorrowStart); tomorrowEnd.setHours(23, 59, 59, 999);

        const calls = await VideoCall.find({
            scheduledFor: { $gte: tomorrowStart, $lte: tomorrowEnd },
            completed: false,
            reminderSent: { $ne: true }   // cubre false, null y undefined (campos pre-existentes)
        }).populate('userId', 'name email plan isActive');

        for (const call of calls) {
            if (!call.userId || !call.userId.isActive) continue;
            const typeLabel = { seguimiento: 'Seguimiento', evaluacion: 'Evaluación Inicial', revision: 'Revisión de Rutina' }[call.type] || call.type;
            await sendVideoCallReminderEmail(call.userId, call.scheduledFor, typeLabel);
            call.reminderSent = true;
            await call.save();
        }

        if (calls.length > 0) {
            console.log(`📅 Recordatorios videollamada enviados: ${calls.length}`);
        }
    } catch (err) {
        console.error('Error en checkSubscriptionReminders:', err.message);
    }
}

// Ejecutar al arrancar y luego cada 24h
setTimeout(() => {
    checkSubscriptionReminders();
    setInterval(checkSubscriptionReminders, 24 * 60 * 60 * 1000);
}, 10000); // espera 10s a que MongoDB esté listo

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 Servidor Effort Online corriendo en http://localhost:${PORT}`);
    const mongoHost = MONGODB_URI.split('@')[1]?.split('/')[0] || 'local';
    console.log(`📊 MongoDB: ${mongoHost}`);
    console.log(`📧 Resend: ${RESEND_API_KEY ? 'Configurado ✅' : 'NO CONFIGURADO ❌'}`);
    console.log(`📤 FROM_EMAIL: ${FROM_EMAIL}`);
    console.log(`💰 Tarifas 2025 - Básico: 149€ | Premium: 199€ | Élite: 249€`);
});
