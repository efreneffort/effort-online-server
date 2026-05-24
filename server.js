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
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

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
const JWT_SECRET = process.env.JWT_SECRET || 'effort_online_secret_key_2025';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/effort-online';
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_BiC1NgD5_5CqHZ6HFSaJFAkoRCqQ3tG9M';

// FROM_EMAIL: validar que el dominio tenga TLD (al menos un punto después del @)
const _rawFrom = process.env.FROM_EMAIL || '';
const _emailMatch = _rawFrom.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
const FROM_EMAIL = _emailMatch
    ? _rawFrom
    : 'Effort Online <hola@effortpozuelo.com>';

const REPLY_TO = process.env.REPLY_TO || 'effortentrenador@gmail.com';

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
    period: { type: String, enum: ['monthly', 'quarterly', 'biannual', 'annual'], required: true },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    isActive: { type: Boolean, default: true },
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
const RoutineSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exercises: [{
        exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
        sets: Number,
        reps: String,
        rest: Number,
        notes: String
    }],
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
    completed: { type: Boolean, default: false }
});

const VideoCall = mongoose.model('VideoCall', VideoCallSchema);

// Logro/Badge
const AchievementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    badgeType: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now }
});

const Achievement = mongoose.model('Achievement', AchievementSchema);

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
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
            basico: { monthly: 14900, quarterly: 39900, biannual: 69900, annual: 118800 },
            premium: { monthly: 19900, quarterly: 54900, biannual: 99900, annual: 154800 },
            elite: { monthly: 24900, quarterly: 69900, biannual: 129900, annual: 190800 }
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
        const validPeriods = ['monthly', 'quarterly', 'biannual', 'annual'];
        if (!validPlans.includes(plan) || !validPeriods.includes(period)) {
            return res.status(400).json({ error: 'Plan o período inválido' });
        }

        // TARIFAS 2025 FINALES (en céntimos para Stripe)
        const prices = {
            basico:   { monthly: 14900, quarterly:  39900, biannual:  69900, annual: 118800 },
            premium:  { monthly: 19900, quarterly:  54900, biannual:  99900, annual: 154800 },
            elite:    { monthly: 24900, quarterly:  69900, biannual: 129900, annual: 190800 }
        };

        const planNames   = { basico: 'Plan Básico', premium: 'Plan Premium', elite: 'Plan Élite' };
        const periodNames = { monthly: 'Mensual', quarterly: 'Trimestral', biannual: 'Semestral', annual: 'Anual' };

        const amount  = prices[plan][period];
        const APP_URL = process.env.APP_URL || 'http://localhost:3000';

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
        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else if (process.env.NODE_ENV !== 'production') {
            event = JSON.parse(req.body.toString());
        } else {
            return res.status(400).send('Stripe webhook secret no configurado');
        }
    } catch (error) {
        console.error('Error verificando webhook:', error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
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
        await checkAndUnlockAchievements(req.user.userId);

        res.status(201).json({
            message: 'Sesión registrada exitosamente',
            session
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

// Obtener rutina de un cliente (admin)
app.get('/api/admin/clients/:clientId/routine', authenticateToken, isAdmin, async (req, res) => {
    try {
        const routine = await Routine.findOne({ userId: req.params.clientId })
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
        const { exercises } = req.body;

        let routine = await Routine.findOne({ userId: clientId });

        if (routine) {
            routine.exercises = exercises;
            routine.updatedAt = new Date();
            await routine.save();
        } else {
            routine = new Routine({
                userId: clientId,
                exercises
            });
            await routine.save();
        }

        res.json({
            message: 'Rutina actualizada exitosamente',
            routine
        });
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

// Agendar videollamada
app.post('/api/admin/videocalls', authenticateToken, isAdmin, async (req, res) => {
    try {
        const videoCall = new VideoCall(req.body);
        await videoCall.save();
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

// Verificar y desbloquear logros
async function checkAndUnlockAchievements(userId) {
    const sessions = await WorkoutSession.find({ userId });
    const achievements = await Achievement.find({ userId });
    const unlockedTypes = achievements.map(a => a.badgeType);

    // First Step
    if (sessions.length >= 1 && !unlockedTypes.includes('first_step')) {
        await new Achievement({ userId, badgeType: 'first_step' }).save();
    }

    // Racha Semanal
    const streak = await calculateStreak(userId);
    if (streak >= 5 && !unlockedTypes.includes('weekly_streak')) {
        await new Achievement({ userId, badgeType: 'weekly_streak' }).save();
    }

    // Semana Perfecta
    if (streak >= 7 && !unlockedTypes.includes('perfect_week')) {
        await new Achievement({ userId, badgeType: 'perfect_week' }).save();
    }

    // Constancia (20 días en un mes)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sessionsThisMonth = await WorkoutSession.countDocuments({
        userId,
        completedAt: { $gte: startOfMonth }
    });

    if (sessionsThisMonth >= 20 && !unlockedTypes.includes('consistency')) {
        await new Achievement({ userId, badgeType: 'consistency' }).save();
    }
}

// ============================================
// FUNCIONES DE ENVÍO DE EMAILS (RESEND)
// ============================================

// Email de bienvenida al registrarse
async function sendWelcomeEmail(user) {
    try {
        const planNames = {
            basico: 'BÁSICO',
            premium: 'PREMIUM',
            elite: 'ÉLITE'
        };

        const APP_URL = process.env.APP_URL || 'http://localhost:3000';

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
                                <a href="${APP_URL}/login.html" style="display: inline-block; background: #00D9A3; color: #001F54; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; max-width: 100%; box-sizing: border-box;">
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
                        <div style="background: #f8f9fa; padding: 1.5rem; text-align: center; color: #999; font-size: 0.85rem;">
                            <p style="margin: 0 0 0.5rem;">
                                <strong>Effort Online</strong> - Entrenamiento personal
                            </p>
                            <p style="margin: 0;">
                                📧 effortentrenador@gmail.com | 📱 609 539 485
                            </p>
                        </div>
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
        const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;

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
                            
                            <p style="color: #666; line-height: 1.6; font-size: 0.95rem;">
                                O copia este enlace en tu navegador:<br>
                                <span style="color: #00D9A3; word-break: break-all;">${resetUrl}</span>
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
                        
                        <div style="background: #f8f9fa; padding: 1.5rem; text-align: center; color: #999; font-size: 0.85rem;">
                            <p style="margin: 0;">📧 effortentrenador@gmail.com | 📱 609 539 485</p>
                        </div>
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

        const APP_URL = process.env.APP_URL || 'http://localhost:3000';

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
                                <a href="${APP_URL}/dashboard.html" style="display: inline-block; background: #00D9A3; color: #001F54; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: bold; max-width: 100%; box-sizing: border-box;">
                                    Acceder a mi dashboard
                                </a>
                            </div>
                            
                            <p style="color: #001F54; margin-top: 2rem;">
                                ¡Gracias por confiar en Effort! 💪<br>
                                <span style="color: #00D9A3;">Efrén</span>
                            </p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 1.5rem; text-align: center; color: #999; font-size: 0.85rem;">
                            <p style="margin: 0;">📧 effortentrenador@gmail.com | 📱 609 539 485</p>
                        </div>
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
async function sendVideoCallReminderEmail(user, callDate, callType) {
    try {
        const formattedDate = new Date(callDate).toLocaleString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
                        
                        <div style="background: #f8f9fa; padding: 1.5rem; text-align: center; color: #999; font-size: 0.85rem;">
                            <p style="margin: 0;">📧 effortentrenador@gmail.com | 📱 609 539 485</p>
                        </div>
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
app.post('/api/auth/forgot-password', async (req, res) => {
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
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 Servidor Effort Online corriendo en http://localhost:${PORT}`);
    console.log(`📊 MongoDB: ${MONGODB_URI}`);
    console.log(`📧 Resend: ${RESEND_API_KEY ? 'Configurado ✅' : 'NO CONFIGURADO ❌'}`);
    console.log(`📤 FROM_EMAIL: ${FROM_EMAIL}`);
    console.log(`💰 Tarifas 2025 - Básico: 149€ | Premium: 199€ | Élite: 249€`);
});
