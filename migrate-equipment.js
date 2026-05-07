// Añade el campo 'equipment' a todos los ejercicios existentes
// Ejecutar: node migrate-equipment.js
require('dotenv').config();
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
    name:      String,
    equipment: { type: String, enum: ['sin_material', 'bandas', 'pesas'], default: 'pesas' }
}, { strict: false });

const Exercise = mongoose.model('Exercise', ExerciseSchema);

// ─── Ejercicios sin material (solo peso corporal) ──────────────────────────
const SIN_MATERIAL = new Set([
    // Del seed original
    'Flexiones', 'Flexiones declinadas', 'Fondos en paralelas (pecho)',
    'Fondos en banco', 'Glute bridge', 'Sentadilla con salto',
    'Plancha isométrica', 'Plancha lateral', 'Crunch abdominal',
    'Russian twist', 'Dead bug', 'Mountain climbers', 'Hollow hold',
    'Pallof press', 'Burpees', 'Jumping jacks',
    'Sprints', 'Carrera en cinta o al aire libre',
    'Curl nórdico', 'Curl nórdico con asistencia',
    'Elevación de piernas colgado', 'Rueda abdominal (ab wheel)',
    // Del seed bodyweight (todos)
    'Flexiones inclinadas (manos elevadas)', 'Flexiones diamante',
    'Flexiones arquero', 'Flexiones con palmada',
    'Flexiones lentas (tempo 4-0-4)', 'Flexiones a un brazo (asistida)',
    'Flexiones con pies elevados', 'Flexiones en pico (pike push-up)',
    'Superman', 'Superman alterno (pájaro-perro)',
    'Extensión de espalda en suelo', 'Nadador en suelo',
    'Remo con toalla en puerta', 'Buenos días con peso corporal',
    'Hiperextensión en suelo (cobras)',
    'Flexión de pino asistida', 'Toque de hombros en plancha',
    'Círculos de brazo', 'Y-T-W en suelo',
    'Flexión de pino completa (handstand push-up)',
    'Curl isométrico con mano contraria', 'Curl con mochila',
    'Curl en barra de dominadas (supino)',
    'Fondos entre dos sillas',
    'Extensión de tríceps en suelo (skull crusher corporal)',
    'Flexiones de tríceps (agarre estrecho)',
    'Sentadilla con peso corporal', 'Sentadilla profunda (ass to grass)',
    'Sentadilla en pared (wall sit)', 'Sentadilla pistola (asistida)',
    'Sentadilla pistola completa', 'Sentadilla lateral',
    'Zancada reversa', 'Zancada lateral', 'Zancada caminando',
    'Step-up sin peso',
    'Peso muerto a una pierna sin peso',
    'Curl isquiotibial en suelo (leg curl deslizante)',
    'Puente de glúteo con una pierna',
    'Patada trasera en cuadrupedia',
    'Patada lateral en cuadrupedia (fire hydrant)',
    'Abducción lateral tumbado', 'Clamshell',
    'Hip thrust con peso corporal', 'Sentadilla sumo con peso corporal',
    'Donkey kick', 'Glute bridge con marcha',
    'Elevación de talones con peso corporal',
    'Elevación de talones en suelo plano', 'Saltos de gemelo',
    'Bicicleta abdominal', 'Elevación de piernas en suelo',
    'Tijeras horizontales', 'Flutter kicks', 'V-sit', 'Sit-up completo',
    'Crunch con giro (oblicuo)', 'Plancha con rotación (T push-up)',
    'Plancha dinámica (subir y bajar)', 'Plancha con elevación de pierna',
    'Windshield wipers', 'Toe touches', 'Plank saw',
    'High knees', 'Butt kicks', 'Skater jumps', 'Tuck jumps',
    'Bear crawl', 'Inchworm', 'Lateral hops', 'Squat jumps',
    'Speed skaters', 'Seal jacks', 'Crocodile walk',
    'Lateral shuffles', 'Paso del oso (bear hug)',
    "World's greatest stretch", 'Hip 90/90',
    'Thoracic spine rotation', 'Ankle circles',
]);

// ─── Ejercicios con bandas elásticas ──────────────────────────────────────
// (por ahora vacío — se añadirán cuando se seedeen ejercicios de bandas)
const BANDAS = new Set([]);

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const all = await Exercise.find({});
    let sinMat = 0, bandas = 0, pesas = 0, already = 0;

    for (const ex of all) {
        if (ex.equipment) { already++; continue; }

        let eq = 'pesas';
        if (SIN_MATERIAL.has(ex.name)) eq = 'sin_material';
        else if (BANDAS.has(ex.name))  eq = 'bandas';

        await Exercise.updateOne({ _id: ex._id }, { $set: { equipment: eq } });
        if (eq === 'sin_material') sinMat++;
        else if (eq === 'bandas')  bandas++;
        else                       pesas++;
    }

    // Aseguramos que los ejercicios sin material ya existentes también se actualicen
    // aunque ya tuvieran equipment (por si se ejecutó antes sin este campo)
    const sinMatRes = await Exercise.updateMany(
        { name: { $in: [...SIN_MATERIAL] }, equipment: { $ne: 'sin_material' } },
        { $set: { equipment: 'sin_material' } }
    );

    console.log('📊 Resultado:');
    console.log(`   Sin material  : ${sinMat}`);
    console.log(`   Bandas        : ${bandas}`);
    console.log(`   Pesas         : ${pesas}`);
    console.log(`   Ya tenían campo: ${already}`);
    if (sinMatRes.modifiedCount) console.log(`   Corregidos sin_material: ${sinMatRes.modifiedCount}`);

    // Resumen final
    const counts = await Exercise.aggregate([
        { $group: { _id: '$equipment', total: { $sum: 1 } } }
    ]);
    console.log('\n📋 Total por tipo:');
    counts.forEach(c => console.log(`   ${c._id ?? 'sin campo'}: ${c.total}`));

    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
