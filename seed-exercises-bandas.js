// Ejercicios con bandas / gomas elásticas
// Ejecutar: node seed-exercises-bandas.js
require('dotenv').config();
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    category:    { type: String, required: true },
    muscleGroup: String,
    difficulty:  { type: String, enum: ['baja', 'media', 'alta'], required: true },
    equipment:   { type: String, enum: ['sin_material', 'bandas', 'pesas'], default: 'bandas' },
    description: String,
    videoUrl:    { type: String, default: '' },
    createdAt:   { type: Date, default: Date.now }
});

const Exercise = mongoose.model('Exercise', ExerciseSchema);

const exercises = [

    // ── PECHO ──────────────────────────────────────────────────────────────
    {
        name: 'Press de pecho con banda (anclada)',
        category: 'pecho', muscleGroup: 'Pectoral mayor',
        difficulty: 'baja',
        description: 'Ancla la banda a la altura del pecho en una pared, poste o puerta. De espaldas al anclaje, empuja hacia delante extendiendo los codos. Simula el press de banca sin mancuernas.'
    },
    {
        name: 'Press inclinado con banda',
        category: 'pecho', muscleGroup: 'Pectoral superior',
        difficulty: 'baja',
        description: 'Ancla la banda baja (a la altura de la cintura o suelo). Empuja hacia arriba y delante en ángulo de 45°. Activa la parte superior del pectoral como el press inclinado.'
    },
    {
        name: 'Aperturas / cruce de pecho con banda',
        category: 'pecho', muscleGroup: 'Pectoral mayor',
        difficulty: 'baja',
        description: 'Ancla la banda a la altura del pecho a los lados o detrás. Con los brazos ligeramente flexionados, júntalos frente al pecho en un arco amplio contrayendo el pectoral.'
    },
    {
        name: 'Cruce de pecho alto con banda',
        category: 'pecho', muscleGroup: 'Pectoral inferior',
        difficulty: 'baja',
        description: 'Ancla la banda por encima de la cabeza. Tira hacia abajo y al centro cruzando las manos. Trabaja la porción inferior del pectoral, como las poleas cruzadas altas.'
    },
    {
        name: 'Pull-over con banda',
        category: 'pecho', muscleGroup: 'Pectoral / Dorsal',
        difficulty: 'baja',
        description: 'Ancla la banda alta. Tumbado o de pie, con los brazos extendidos hacia arriba baja la banda en arco hasta los muslos. Trabaja el pectoral y el dorsal simultáneamente.'
    },
    {
        name: 'Flexiones con banda en la espalda',
        category: 'pecho', muscleGroup: 'Pectoral mayor / Tríceps',
        difficulty: 'alta',
        description: 'Coloca la banda sobre la espalda anclando los extremos bajo las palmas. La banda añade resistencia extra en la fase concéntrica de las flexiones. Aumenta la intensidad progresivamente.'
    },

    // ── ESPALDA ────────────────────────────────────────────────────────────
    {
        name: 'Jalón al pecho con banda',
        category: 'espalda', muscleGroup: 'Dorsal ancho',
        difficulty: 'baja',
        description: 'Ancla la banda por encima de la cabeza (puerta, barra). De rodillas o sentado, tira hacia el pecho llevando los codos hacia abajo y atrás. Simula el jalón en polea.'
    },
    {
        name: 'Remo con banda (bilateral)',
        category: 'espalda', muscleGroup: 'Dorsal / Romboides',
        difficulty: 'baja',
        description: 'Pisa la banda con ambos pies. Inclinado 45°, tira de los extremos hacia las caderas retrayendo las escápulas. Simula el remo con barra sin equipamiento de gimnasio.'
    },
    {
        name: 'Remo con banda (unilateral)',
        category: 'espalda', muscleGroup: 'Dorsal ancho',
        difficulty: 'baja',
        description: 'Pisa la banda con el pie del mismo lado. Con una sola mano, tira hacia la cadera como el remo con mancuerna. Permite más rango de movimiento y corrección de desequilibrios.'
    },
    {
        name: 'Face pull con banda',
        category: 'espalda', muscleGroup: 'Deltoides posterior / Romboides',
        difficulty: 'baja',
        description: 'Ancla la banda a la altura de la cabeza. Tira hacia la cara separando las manos al final, codos hacia los lados y arriba. Fundamental para la salud del hombro y la postura.'
    },
    {
        name: 'Pull-apart con banda',
        category: 'espalda', muscleGroup: 'Deltoides posterior / Trapecio medio',
        difficulty: 'baja',
        description: 'Sostén la banda con ambas manos al frente a la altura del pecho, brazos extendidos. Separa las manos llevándolas hacia los lados hasta abrir por completo. Clave para la postura.'
    },
    {
        name: 'Pull-apart invertido con banda',
        category: 'espalda', muscleGroup: 'Deltoides posterior / Trapecio inferior',
        difficulty: 'baja',
        description: 'Igual que el pull-apart pero con los brazos a 45° hacia arriba (en Y). Mayor activación del trapecio inferior y el deltoides posterior. Complementa el pull-apart estándar.'
    },
    {
        name: 'Jalón unilateral con banda',
        category: 'espalda', muscleGroup: 'Dorsal ancho (unilateral)',
        difficulty: 'baja',
        description: 'Ancla la banda arriba. Con un solo brazo, tira en diagonal hacia la cadera. Permite trabajar cada lado de forma independiente corrigiendo asimetrías de fuerza.'
    },
    {
        name: 'Remo en W con banda',
        category: 'espalda', muscleGroup: 'Romboides / Trapecio medio',
        difficulty: 'baja',
        description: 'Ancla la banda a la altura del pecho. Tira llevando los codos hacia atrás y doblándolos a 90° (formando una W con los brazos). Retrae fuerte las escápulas al final.'
    },
    {
        name: 'Good morning con banda',
        category: 'espalda', muscleGroup: 'Erector espinal / Isquiotibiales',
        difficulty: 'baja',
        description: 'Pisa la banda, extremos sobre los hombros. Inclínate hacia delante desde la cadera manteniendo la espalda neutra. Fortalece los lumbares y los isquiotibiales de forma segura.'
    },

    // ── HOMBROS ────────────────────────────────────────────────────────────
    {
        name: 'Press militar con banda',
        category: 'hombros', muscleGroup: 'Deltoides anterior / medial',
        difficulty: 'baja',
        description: 'Pisa la banda con los pies. Lleva los extremos a la altura de los hombros y empuja hacia arriba extendiendo los codos. Simula el press militar con barra.'
    },
    {
        name: 'Elevaciones laterales con banda',
        category: 'hombros', muscleGroup: 'Deltoides medial',
        difficulty: 'baja',
        description: 'Pisa la banda con un pie o ambos. Eleva los brazos hacia los lados hasta la horizontal. La tensión inicial de la banda es menor — ideal para trabajar el delta medial con continuidad.'
    },
    {
        name: 'Elevaciones frontales con banda',
        category: 'hombros', muscleGroup: 'Deltoides anterior',
        difficulty: 'baja',
        description: 'Pisa la banda, eleva un brazo o los dos hacia delante hasta la horizontal. Mantén el codo casi extendido y el core activo para no compensar con la espalda.'
    },
    {
        name: 'Rotación externa de hombro con banda',
        category: 'hombros', muscleGroup: 'Manguito rotador (infraespinoso)',
        difficulty: 'baja',
        description: 'Ancla la banda a la altura del codo. Codo doblado a 90° pegado al costado. Rota el antebrazo hacia afuera. Ejercicio fundamental de rehabilitación y prevención en el hombro.'
    },
    {
        name: 'Rotación interna de hombro con banda',
        category: 'hombros', muscleGroup: 'Manguito rotador (subescapular)',
        difficulty: 'baja',
        description: 'Ancla la banda a la altura del codo. Codo doblado a 90°, rota el antebrazo hacia el abdomen. Trabaja el subescapular. Par fundamental con la rotación externa.'
    },
    {
        name: 'Elevación lateral unilateral con banda cruzada',
        category: 'hombros', muscleGroup: 'Deltoides medial',
        difficulty: 'baja',
        description: 'Pisa la banda con el pie contrario. El cruce crea una línea de tracción que mantiene tensión constante en todo el recorrido, a diferencia de la elevación con mancuerna.'
    },
    {
        name: 'Press Arnold con banda',
        category: 'hombros', muscleGroup: 'Deltoides (los tres haces)',
        difficulty: 'media',
        description: 'Pisa la banda. Empieza con palmas hacia ti a la altura de los hombros. Rota las muñecas mientras empujas hacia arriba hasta que las palmas miren hacia delante en la posición alta.'
    },
    {
        name: 'Encogimientos de hombros con banda',
        category: 'hombros', muscleGroup: 'Trapecio superior',
        difficulty: 'baja',
        description: 'Pisa la banda con ambos pies. Sostén los extremos a los costados y sube los hombros hacia las orejas. Mantén 1 segundo en la posición alta. Trabaja el trapecio superior.'
    },

    // ── BÍCEPS ─────────────────────────────────────────────────────────────
    {
        name: 'Curl de bíceps con banda',
        category: 'biceps', muscleGroup: 'Bíceps braquial',
        difficulty: 'baja',
        description: 'Pisa la banda con ambos pies a la anchura de caderas. Flexiona los codos llevando las manos hacia los hombros. La resistencia aumenta progresivamente con la flexión.'
    },
    {
        name: 'Curl martillo con banda',
        category: 'biceps', muscleGroup: 'Braquiorradial / Bíceps',
        difficulty: 'baja',
        description: 'Pisa la banda, agarre neutro (pulgares arriba). Flexiona los codos sin rotar las muñecas. Trabaja el braquiorradial y añade grosor al brazo.'
    },
    {
        name: 'Curl concentrado con banda',
        category: 'biceps', muscleGroup: 'Pico del bíceps',
        difficulty: 'baja',
        description: 'Sentado, pisa la banda con el pie del mismo lado. Codo apoyado en la cara interna del muslo. Flexiona el codo despacio. Máximo aislamiento del bíceps.'
    },
    {
        name: 'Curl inclinado con banda',
        category: 'biceps', muscleGroup: 'Cabeza larga del bíceps',
        difficulty: 'baja',
        description: 'Ancla la banda detrás de ti a baja altura. De pie inclinado ligeramente hacia delante, flexiona los codos. La posición estira la cabeza larga aumentando el rango de trabajo.'
    },
    {
        name: 'Curl con banda anclada arriba',
        category: 'biceps', muscleGroup: 'Bíceps braquial',
        difficulty: 'baja',
        description: 'Ancla la banda a la altura de los hombros. Tira hacia ti flexionando los codos como si te llevaras las manos a la cabeza. Trabaja el bíceps con el brazo elevado, activando la cabeza corta.'
    },
    {
        name: 'Curl de bíceps unilateral con banda',
        category: 'biceps', muscleGroup: 'Bíceps braquial (unilateral)',
        difficulty: 'baja',
        description: 'Pisa la banda con un pie. Trabaja un brazo a la vez para mayor concentración y corrección de desequilibrios. Supina la muñeca al llegar arriba.'
    },

    // ── TRÍCEPS ────────────────────────────────────────────────────────────
    {
        name: 'Extensión de tríceps sobre la cabeza con banda',
        category: 'triceps', muscleGroup: 'Cabeza larga del tríceps',
        difficulty: 'baja',
        description: 'Pisa la banda, lleva el extremo detrás de la cabeza. Extiende los codos hacia arriba. Estira y activa especialmente la cabeza larga del tríceps.'
    },
    {
        name: 'Pushdown de tríceps con banda',
        category: 'triceps', muscleGroup: 'Tríceps braquial',
        difficulty: 'baja',
        description: 'Ancla la banda arriba. De pie, codos pegados al costado. Empuja hacia abajo extendiendo los codos. Misma mecánica que el pushdown en polea de gimnasio.'
    },
    {
        name: 'Pushdown de tríceps con cuerda (banda en V)',
        category: 'triceps', muscleGroup: 'Cabeza lateral del tríceps',
        difficulty: 'baja',
        description: 'Ancla la banda arriba. Al llegar abajo, separa las manos hacia afuera girando las muñecas. Activa más la cabeza lateral del tríceps que el pushdown estándar.'
    },
    {
        name: 'Press francés con banda',
        category: 'triceps', muscleGroup: 'Tríceps (cabeza larga)',
        difficulty: 'baja',
        description: 'Pisa la banda o anclada baja. Tumbado o de pie, flexiona los codos llevando las manos detrás de la cabeza y extiende. Simula el press francés sin mancuernas.'
    },
    {
        name: 'Patada de tríceps con banda',
        category: 'triceps', muscleGroup: 'Cabeza lateral del tríceps',
        difficulty: 'baja',
        description: 'Pisa la banda con un pie. Inclinado hacia delante, codo a 90°. Extiende el brazo hacia atrás hasta quedar paralelo al suelo. Contrae fuerte el tríceps al final del recorrido.'
    },
    {
        name: 'Fondos en paralelas asistidos con banda',
        category: 'triceps', muscleGroup: 'Tríceps braquial',
        difficulty: 'baja',
        description: 'Cuelga la banda de la barra de paralelas. Apoya las rodillas o los pies en la banda. La banda reduce tu peso efectivo. Ideal para aprender los fondos desde cero.'
    },

    // ── CUÁDRICEPS ─────────────────────────────────────────────────────────
    {
        name: 'Sentadilla con banda',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos',
        difficulty: 'baja',
        description: 'Pisa la banda, extremos sobre los hombros. La banda añade resistencia progresiva en la subida. Puedes usarla también rodeando los muslos para activar más el glúteo mediano.'
    },
    {
        name: 'Sentadilla sumo con banda',
        category: 'piernas', muscleGroup: 'Aductores / Glúteos / Cuádriceps',
        difficulty: 'baja',
        description: 'Pisa la banda con los pies muy separados, extremos sobre los hombros o sostenidos en las manos. Mayor activación del interior del muslo y los glúteos.'
    },
    {
        name: 'Prensa en suelo con banda',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos',
        difficulty: 'baja',
        description: 'Tumbado boca arriba, ancla la banda en los pies. Dobla las rodillas hacia el pecho y empuja hacia arriba extendiendo las piernas. Simula la prensa de piernas tumbado en el suelo.'
    },
    {
        name: 'Extensión de cuádriceps con banda',
        category: 'piernas', muscleGroup: 'Cuádriceps',
        difficulty: 'baja',
        description: 'Ancla la banda baja detrás de ti. Sentado en una silla, engánchala en el tobillo y extiende la rodilla. Simula la máquina de extensiones sin equipamiento de gimnasio.'
    },
    {
        name: 'Zancada con banda',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos',
        difficulty: 'baja',
        description: 'Pisa la banda con el pie delantero. Los extremos sobre los hombros o sostenidos en las manos. Mayor resistencia en la subida. Trabaja cuádriceps y glúteos de forma funcional.'
    },
    {
        name: 'Sentadilla búlgara con banda',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos (unilateral)',
        difficulty: 'media',
        description: 'Pie trasero elevado. Pisa la banda con el pie delantero, extremos sobre los hombros. Alta demanda de cuádriceps y glúteos con la comodidad de la banda frente a la barra.'
    },

    // ── ISQUIOTIBIALES ─────────────────────────────────────────────────────
    {
        name: 'Curl femoral de pie con banda',
        category: 'piernas', muscleGroup: 'Isquiotibiales',
        difficulty: 'baja',
        description: 'Ancla la banda baja detrás de ti. Engancha en el tobillo de pie. Flexiona la rodilla llevando el talón hacia el glúteo. Simula el curl femoral de pie en máquina.'
    },
    {
        name: 'Curl femoral tumbado con banda',
        category: 'piernas', muscleGroup: 'Isquiotibiales',
        difficulty: 'baja',
        description: 'Ancla la banda a baja altura. Tumbado boca abajo, banda enganchada en los tobillos. Flexiona las rodillas. Misma mecánica que la máquina de curl femoral tumbado.'
    },
    {
        name: 'Peso muerto rumano con banda',
        category: 'piernas', muscleGroup: 'Isquiotibiales / Glúteos',
        difficulty: 'baja',
        description: 'Pisa la banda con ambos pies. Sostén los extremos con las manos. Inclínate hacia delante empujando la cadera hacia atrás con piernas casi rectas. La banda da una resistencia uniforme en todo el recorrido.'
    },
    {
        name: 'Peso muerto a una pierna con banda',
        category: 'piernas', muscleGroup: 'Isquiotibiales / Glúteos (unilateral)',
        difficulty: 'media',
        description: 'Pisa la banda con un pie, sostén con la mano contraria. Trabaja el equilibrio y la fuerza unilateral de los isquios y glúteos sin necesidad de mancuernas.'
    },

    // ── GLÚTEOS ────────────────────────────────────────────────────────────
    {
        name: 'Patada de glúteo trasera con banda (de pie)',
        category: 'piernas', muscleGroup: 'Glúteo mayor',
        difficulty: 'baja',
        description: 'Ancla la banda baja o pisa su mitad. Engancha en el tobillo. De pie, extiende la pierna hacia atrás contrayendo el glúteo. El ejercicio más clásico de glúteo con banda elástica.'
    },
    {
        name: 'Patada trasera en cuadrupedia con banda',
        category: 'piernas', muscleGroup: 'Glúteo mayor',
        difficulty: 'baja',
        description: 'En cuadrupedia, banda enganchada en el pie y anclada o pisada con la mano contraria. Extiende la pierna hacia atrás y arriba apretando el glúteo en la posición alta.'
    },
    {
        name: 'Patada lateral con banda (de pie)',
        category: 'piernas', muscleGroup: 'Glúteo mediano',
        difficulty: 'baja',
        description: 'Ancla la banda baja. Engancha en el tobillo y eleva la pierna hacia el lado. Activa el glúteo medio en un ángulo diferente al de la abducción tumbada. Ideal para definir la cadera.'
    },
    {
        name: 'Abducción de cadera con banda (tumbada)',
        category: 'piernas', muscleGroup: 'Glúteo mediano / TFL',
        difficulty: 'baja',
        description: 'Banda enrollada sobre los muslos (justo por encima de las rodillas). Tumbada de lado, eleva la pierna superior hacia el techo. La banda añade resistencia al movimiento de abducción.'
    },
    {
        name: 'Clamshell con banda',
        category: 'piernas', muscleGroup: 'Glúteo mediano / Rotadores externos',
        difficulty: 'baja',
        description: 'Banda sobre los muslos. Tumbada de lado con caderas y rodillas a 45°. Abre la rodilla superior como una almeja contra la resistencia de la banda. Más intenso que sin banda.'
    },
    {
        name: 'Hip thrust con banda',
        category: 'piernas', muscleGroup: 'Glúteo mayor',
        difficulty: 'baja',
        description: 'Espalda en banco, banda sobre las caderas pisada por los pies o anclada al suelo. Empuja las caderas hacia arriba. La banda aumenta la resistencia en la posición alta, donde más trabaja el glúteo.'
    },
    {
        name: 'Glute bridge con banda',
        category: 'piernas', muscleGroup: 'Glúteo mayor',
        difficulty: 'baja',
        description: 'Tumbada boca arriba, banda sobre las caderas pisada por los pies. Misma mecánica que el hip thrust pero en el suelo. Más accesible y igual de efectivo para el glúteo mayor.'
    },
    {
        name: 'Monster walk con banda',
        category: 'piernas', muscleGroup: 'Glúteo mediano / Aductores',
        difficulty: 'baja',
        description: 'Banda sobre los tobillos o muslos. En posición atlética (rodillas ligeramente flexionadas), da pasos laterales amplios manteniendo la tensión de la banda. Activa el glúteo medio de forma dinámica y funcional.'
    },
    {
        name: 'Monster walk diagonal con banda',
        category: 'piernas', muscleGroup: 'Glúteo mayor y mediano',
        difficulty: 'baja',
        description: 'Igual que el monster walk pero dando pasos en diagonal hacia delante y hacia atrás alternativamente. Activa tanto el glúteo mayor como el mediano en un único patrón de movimiento.'
    },
    {
        name: 'Sentadilla con banda en rodillas',
        category: 'piernas', muscleGroup: 'Glúteo mediano / Cuádriceps',
        difficulty: 'baja',
        description: 'Banda justo por encima de las rodillas. Realiza la sentadilla empujando las rodillas hacia afuera contra la resistencia de la banda. Activa el glúteo mediano y corrige el valgo de rodilla.'
    },
    {
        name: 'Donkey kick con banda',
        category: 'piernas', muscleGroup: 'Glúteo mayor',
        difficulty: 'baja',
        description: 'En cuadrupedia, banda enganchada en el pie. Lleva el talón hacia el techo doblando la rodilla a 90°. La banda amplifica la contracción del glúteo en cada repetición.'
    },
    {
        name: 'Abducción de cadera de pie con banda (cruzada)',
        category: 'piernas', muscleGroup: 'Glúteo mediano',
        difficulty: 'baja',
        description: 'Ancla la banda baja en el tobillo contrario. De pie, abre la pierna hacia el lado cruzando la línea media. La dirección de la tracción crea un estímulo diferente al anclaje lateral.'
    },
    {
        name: 'Patada de glúteo hacia atrás en cuadrupedia (rodilla doblada)',
        category: 'piernas', muscleGroup: 'Glúteo mayor',
        difficulty: 'baja',
        description: 'En cuadrupedia, banda en el pie. Empuja el talón hacia el techo manteniendo la rodilla a 90° (donkey kick). Variante que concentra el estímulo en el glúteo mayor con menos participación del isquio.'
    },

    // ── GEMELOS ────────────────────────────────────────────────────────────
    {
        name: 'Elevación de talones sentado con banda',
        category: 'piernas', muscleGroup: 'Sóleo / Gastrocnemio',
        difficulty: 'baja',
        description: 'Sentado con la banda sobre los muslos o el antepié. Sube de puntillas contra la resistencia. Trabaja especialmente el sóleo. Más cómodo para articulaciones que con barra.'
    },
    {
        name: 'Flexión dorsal de tobillo con banda',
        category: 'piernas', muscleGroup: 'Tibial anterior',
        difficulty: 'baja',
        description: 'Ancla la banda en el empeine. Sentado con la pierna extendida, tira de la punta del pie hacia ti contra la resistencia. Fortalece el tibial anterior, fundamental en la prevención de lesiones.'
    },

    // ── CORE ───────────────────────────────────────────────────────────────
    {
        name: 'Pallof press con banda',
        category: 'core', muscleGroup: 'Core anti-rotación',
        difficulty: 'baja',
        description: 'Ancla la banda a la altura del pecho. De pie de lado al anclaje. Empuja la banda hacia delante resistiendo la rotación del torso. Uno de los mejores ejercicios de estabilidad de core.'
    },
    {
        name: 'Pallof press con banda (con rotación)',
        category: 'core', muscleGroup: 'Oblicuos / Core',
        difficulty: 'media',
        description: 'Igual que el Pallof press pero al extender los brazos gira el torso hacia afuera del anclaje y vuelve al centro. Versión dinámica que trabaja los oblicuos de forma intensa.'
    },
    {
        name: 'Rotación de torso con banda',
        category: 'core', muscleGroup: 'Oblicuos',
        difficulty: 'baja',
        description: 'Ancla la banda a la altura del pecho. De lado, brazos extendidos. Rota el torso alejándote del anclaje. La banda trabaja los oblicuos en todo el recorrido. Útil para deportes de raqueta y golf.'
    },
    {
        name: 'Chop con banda (leñador alto-bajo)',
        category: 'core', muscleGroup: 'Oblicuos / Core diagonal',
        difficulty: 'media',
        description: 'Ancla la banda arriba. Tira en diagonal desde el hombro hasta la cadera contraria como si cortaras leña. Trabaja el patrón diagonal del core que se usa en casi todos los deportes.'
    },
    {
        name: 'Lift con banda (leñador bajo-alto)',
        category: 'core', muscleGroup: 'Oblicuos / Core diagonal',
        difficulty: 'media',
        description: 'Ancla la banda abajo. Tira en diagonal desde la cadera hasta el hombro contrario. Patrón contrario al chop. Complemento perfecto para el trabajo de core diagonal.'
    },
    {
        name: 'Crunch con banda',
        category: 'core', muscleGroup: 'Recto abdominal',
        difficulty: 'baja',
        description: 'Ancla la banda sobre la cabeza. Tumbado, sostén la banda con las manos en la nuca. Al hacer el crunch la banda añade resistencia. Mayor estímulo abdominal que el crunch sin carga.'
    },
    {
        name: 'Plancha con banda en pies (tracción)',
        category: 'core', muscleGroup: 'Core / Dorsal',
        difficulty: 'alta',
        description: 'En plancha alta, banda anclada detrás sujeta con los pies. La tracción de la banda hacia atrás obliga al core a trabajar isométricamente más fuerte para mantener la posición.'
    },
    {
        name: 'Dead bug con banda',
        category: 'core', muscleGroup: 'Core estabilizador',
        difficulty: 'media',
        description: 'Tumbado boca arriba sosteniendo la banda con ambas manos hacia el techo y pisándola con los pies. Extiende el brazo y la pierna contraria sin perder la tensión de la banda ni la posición lumbar.'
    },
    {
        name: 'Elevación de piernas con banda',
        category: 'core', muscleGroup: 'Recto abdominal inferior / Flexores de cadera',
        difficulty: 'media',
        description: 'Ancla la banda arriba y sujétala con las manos para estabilizarte. Tumbado, sube las piernas rectas contra tu propio peso. La banda da estabilidad pero el trabajo abdominal es mayor al tener la zona lumbar más controlada.'
    },

    // ── CARDIO / FUNCIONAL ─────────────────────────────────────────────────
    {
        name: 'Remo de pie con banda (funcional)',
        category: 'cardio', muscleGroup: 'Espalda / Bíceps / Core',
        difficulty: 'baja',
        description: 'Ancla la banda a la altura del pecho. De pie, tira de forma rítmica y continua sin detenerte. Integra el movimiento de remo en un circuito de cardio funcional de alto rendimiento.'
    },
    {
        name: 'Squat to press con banda',
        category: 'cardio', muscleGroup: 'Cuerpo completo',
        difficulty: 'media',
        description: 'Pisa la banda. Baja en sentadilla llevando los extremos a los hombros y al subir empuja hacia arriba haciendo un press. Combina tren inferior y superior en un movimiento continuo y explosivo.'
    },
    {
        name: 'Curl to press con banda',
        category: 'cardio', muscleGroup: 'Bíceps / Hombros',
        difficulty: 'baja',
        description: 'Pisa la banda. Realiza un curl de bíceps y al llegar arriba convierte el movimiento en un press de hombro. Ejercicio combinado muy usado en rutinas de circuito.'
    },
    {
        name: 'Lateral walk con banda',
        category: 'cardio', muscleGroup: 'Glúteo mediano / Cardiovascular',
        difficulty: 'baja',
        description: 'Banda sobre los tobillos o muslos. Camina lateralmente 10-15 pasos hacia un lado y vuelve. Activa el glúteo mediano de forma dinámica y continua. Clásico de activación y circuitos funcionales.'
    },
    {
        name: 'Sprints con resistencia de banda',
        category: 'cardio', muscleGroup: 'Cardiovascular / Tren inferior',
        difficulty: 'alta',
        description: 'Un compañero sostiene la banda anclada a tu cintura mientras corres hacia delante. La resistencia de la banda aumenta la demanda del tren inferior. Ideal para entrenamiento deportivo de potencia.'
    },
    {
        name: 'Jumping jacks con banda en tobillos',
        category: 'cardio', muscleGroup: 'Glúteo mediano / Cardiovascular',
        difficulty: 'media',
        description: 'Banda en los tobillos. Realiza jumping jacks normales. La apertura de piernas trabaja el glúteo mediano contra la resistencia de la banda en cada repetición.'
    },
];

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    let inserted = 0;
    let skipped  = 0;

    for (const ex of exercises) {
        const result = await Exercise.updateOne(
            { name: ex.name },
            { $setOnInsert: ex },
            { upsert: true }
        );
        if (result.upsertedCount > 0) inserted++;
        else skipped++;
    }

    const total = await Exercise.countDocuments();
    const bandas = await Exercise.countDocuments({ equipment: 'bandas' });

    console.log('📊 Resultado:');
    console.log(`   Ejercicios nuevos insertados : ${inserted}`);
    console.log(`   Ya existían (sin cambios)    : ${skipped}`);
    console.log(`   Total ejercicios con bandas  : ${bandas}`);
    console.log(`   Total en la base de datos    : ${total}`);

    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
