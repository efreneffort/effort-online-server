// Ejecutar: node seed-exercises.js
require('dotenv').config();
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    category:    { type: String, required: true },
    muscleGroup: String,
    difficulty:  { type: String, enum: ['baja', 'media', 'alta'], required: true },
    description: String,
    videoUrl:    { type: String, default: '' },
    createdAt:   { type: Date, default: Date.now }
});

const Exercise = mongoose.model('Exercise', ExerciseSchema);

const exercises = [

    // ── PECHO ──────────────────────────────────────────────────────────────
    {
        name: 'Press de banca con barra',
        category: 'pecho', muscleGroup: 'Pectoral mayor',
        difficulty: 'media',
        description: 'Tumbado en banco, agarra la barra a la anchura de los hombros. Baja controlando hasta rozar el pecho y empuja hasta extender los codos sin bloquearlos.'
    },
    {
        name: 'Press de banca con mancuernas',
        category: 'pecho', muscleGroup: 'Pectoral mayor',
        difficulty: 'media',
        description: 'Igual que el press con barra pero con mancuernas, lo que permite mayor rango de movimiento. Sube hasta que las mancuernas casi se toquen en la parte superior.'
    },
    {
        name: 'Press inclinado con barra',
        category: 'pecho', muscleGroup: 'Pectoral superior',
        difficulty: 'media',
        description: 'Banco a 30-45°. Baja la barra hacia la parte alta del pecho. Activa especialmente la zona clavicular del pectoral.'
    },
    {
        name: 'Press inclinado con mancuernas',
        category: 'pecho', muscleGroup: 'Pectoral superior',
        difficulty: 'media',
        description: 'Banco inclinado 30-45°. Permite un arco de movimiento amplio. Mantén las muñecas neutras y el core activo durante todo el movimiento.'
    },
    {
        name: 'Flexiones',
        category: 'pecho', muscleGroup: 'Pectoral mayor',
        difficulty: 'baja',
        description: 'Manos a la anchura de los hombros, cuerpo en línea recta. Baja hasta que el pecho casi toque el suelo y empuja hasta extender los brazos.'
    },
    {
        name: 'Flexiones declinadas',
        category: 'pecho', muscleGroup: 'Pectoral inferior',
        difficulty: 'media',
        description: 'Pies elevados en un banco. La inclinación del cuerpo hacia abajo dirige el estímulo a la zona inferior del pectoral.'
    },
    {
        name: 'Aperturas con mancuernas',
        category: 'pecho', muscleGroup: 'Pectoral mayor',
        difficulty: 'baja',
        description: 'Tumbado en banco plano, brazos ligeramente flexionados. Abre los brazos en arco amplio hasta sentir estiramiento y vuelve contrayendo el pectoral.'
    },
    {
        name: 'Cruce de poleas',
        category: 'pecho', muscleGroup: 'Pectoral mayor',
        difficulty: 'baja',
        description: 'De pie entre dos poleas altas. Lleva las manos hacia el centro cruzando los brazos. Mantén una ligera flexión de codo durante todo el recorrido.'
    },
    {
        name: 'Fondos en paralelas (pecho)',
        category: 'pecho', muscleGroup: 'Pectoral inferior',
        difficulty: 'media',
        description: 'En paralelas, inclínate hacia delante ~30° para enfatizar el pectoral. Baja hasta que los hombros queden a la altura de los codos y sube empujando fuerte.'
    },
    {
        name: 'Press de banca con agarre cerrado',
        category: 'pecho', muscleGroup: 'Pectoral / Tríceps',
        difficulty: 'media',
        description: 'Agarre estrecho en la barra. Codos pegados al cuerpo al bajar. Trabaja el pectoral interno y el tríceps de forma intensa.'
    },

    // ── ESPALDA ────────────────────────────────────────────────────────────
    {
        name: 'Dominadas',
        category: 'espalda', muscleGroup: 'Dorsal ancho',
        difficulty: 'media',
        description: 'Cuelga de la barra con agarre prono a la anchura de los hombros. Tira de los codos hacia abajo y atrás hasta que la barbilla supere la barra.'
    },
    {
        name: 'Jalón al pecho en polea',
        category: 'espalda', muscleGroup: 'Dorsal ancho',
        difficulty: 'baja',
        description: 'Sentado en la máquina de jalón, tira de la barra hacia el pecho manteniendo el torso ligeramente inclinado hacia atrás. Retrae las escápulas al final.'
    },
    {
        name: 'Remo con barra',
        category: 'espalda', muscleGroup: 'Dorsal / Trapecio medio',
        difficulty: 'media',
        description: 'Inclinado ~45°, barra colgando. Tira hacia el ombligo retrayendo las escápulas. Mantén la espalda neutra y el core activo en todo momento.'
    },
    {
        name: 'Remo con mancuerna a un brazo',
        category: 'espalda', muscleGroup: 'Dorsal ancho',
        difficulty: 'baja',
        description: 'Rodilla y mano apoyadas en banco. Tira la mancuerna hacia la cadera sin rotar el torso. Rango de movimiento completo.'
    },
    {
        name: 'Peso muerto convencional',
        category: 'espalda', muscleGroup: 'Erector espinal / Isquiotibiales',
        difficulty: 'alta',
        description: 'Pies a la anchura de caderas, barra sobre el empeine. Espalda neutra, pecho arriba. Empuja el suelo con los pies y extiende caderas y rodillas simultáneamente.'
    },
    {
        name: 'Remo en polea baja',
        category: 'espalda', muscleGroup: 'Dorsal / Romboides',
        difficulty: 'baja',
        description: 'Sentado frente a la polea baja. Tira del agarre hacia el abdomen retrayendo las escápulas. Controla la vuelta sin perder la postura.'
    },
    {
        name: 'Pull-over con mancuerna',
        category: 'espalda', muscleGroup: 'Dorsal ancho / Pectoral',
        difficulty: 'baja',
        description: 'Tumbado transversalmente en banco. Con la mancuerna sobre el pecho, baja los brazos por detrás de la cabeza sintiendo el estiramiento del dorsal.'
    },
    {
        name: 'Hiperextensiones',
        category: 'espalda', muscleGroup: 'Erector espinal',
        difficulty: 'baja',
        description: 'En el banco romano, ancla los pies y baja el torso hasta 90°. Sube contrayendo la zona lumbar sin hiperextender al final del movimiento.'
    },
    {
        name: 'Dominadas supinas',
        category: 'espalda', muscleGroup: 'Dorsal / Bíceps',
        difficulty: 'media',
        description: 'Igual que las dominadas pero con agarre supino (palmas mirando hacia ti). Mayor activación del bíceps y zona inferior del dorsal.'
    },
    {
        name: 'Remo invertido en barra',
        category: 'espalda', muscleGroup: 'Dorsal / Romboides',
        difficulty: 'baja',
        description: 'Tumbado bajo una barra fija a altura de cadera. Tira del pecho hacia la barra manteniendo el cuerpo recto. Opción de regresión a las dominadas.'
    },

    // ── HOMBROS ────────────────────────────────────────────────────────────
    {
        name: 'Press militar con barra',
        category: 'hombros', muscleGroup: 'Deltoides anterior / medial',
        difficulty: 'media',
        description: 'De pie o sentado, barra a la altura del pecho. Empuja hacia arriba hasta extender los codos. Activa el core para proteger la zona lumbar.'
    },
    {
        name: 'Press Arnold con mancuernas',
        category: 'hombros', muscleGroup: 'Deltoides (los tres haces)',
        difficulty: 'media',
        description: 'Empieza con mancuernas frente a ti, palmas hacia ti. Al subir, rota las muñecas 180° hasta que las palmas miren hacia delante al llegar arriba.'
    },
    {
        name: 'Elevaciones laterales con mancuernas',
        category: 'hombros', muscleGroup: 'Deltoides medial',
        difficulty: 'baja',
        description: 'De pie, brazos ligeramente flexionados. Eleva las mancuernas hasta la altura de los hombros controlando la bajada. Evita el balanceo del torso.'
    },
    {
        name: 'Elevaciones frontales',
        category: 'hombros', muscleGroup: 'Deltoides anterior',
        difficulty: 'baja',
        description: 'De pie, mancuernas en las manos. Eleva un brazo hacia delante hasta la horizontal manteniendo el codo casi extendido. Alterna brazos.'
    },
    {
        name: 'Pájaro (elevaciones posteriores)',
        category: 'hombros', muscleGroup: 'Deltoides posterior',
        difficulty: 'baja',
        description: 'Inclinado 45° hacia delante, mancuernas colgando. Abre los brazos hacia los lados como si volaras, apretando el deltoides posterior al llegar arriba.'
    },
    {
        name: 'Face Pull en polea',
        category: 'hombros', muscleGroup: 'Deltoides posterior / Manguito rotador',
        difficulty: 'baja',
        description: 'Polea alta con cuerda. Tira hacia la cara separando las manos al final. Fundamental para la salud del hombro y el equilibrio muscular.'
    },
    {
        name: 'Encogimientos de hombros',
        category: 'hombros', muscleGroup: 'Trapecio superior',
        difficulty: 'baja',
        description: 'Con mancuernas o barra, sube los hombros hacia las orejas y mantén 1 segundo en la posición alta. Baja controlando. No gires los hombros.'
    },
    {
        name: 'Press tras nuca',
        category: 'hombros', muscleGroup: 'Deltoides medial / posterior',
        difficulty: 'alta',
        description: 'Barra detrás de la cabeza, empuja hacia arriba. Movimiento de riesgo para el manguito; solo para usuarios con buena movilidad de hombro.'
    },
    {
        name: 'Elevaciones laterales en polea',
        category: 'hombros', muscleGroup: 'Deltoides medial',
        difficulty: 'baja',
        description: 'Polea baja a un lado. Eleva el brazo hasta la horizontal cruzando el cuerpo. Tensión constante al contrario que con mancuernas.'
    },

    // ── BÍCEPS ─────────────────────────────────────────────────────────────
    {
        name: 'Curl con barra',
        category: 'biceps', muscleGroup: 'Bíceps braquial',
        difficulty: 'baja',
        description: 'De pie, agarre supino a la anchura de los hombros. Flexiona los codos llevando la barra hacia el pecho. Controla la bajada.'
    },
    {
        name: 'Curl con mancuernas alterno',
        category: 'biceps', muscleGroup: 'Bíceps braquial',
        difficulty: 'baja',
        description: 'De pie, alterna la flexión de cada brazo. Gira la muñeca al subir para maximizar la contracción. Codos pegados al cuerpo.'
    },
    {
        name: 'Curl martillo',
        category: 'biceps', muscleGroup: 'Braquiorradial / Bíceps',
        difficulty: 'baja',
        description: 'Mancuernas con agarre neutro (pulgares arriba). Sube sin rotar las muñecas. Trabaja el braquiorradial y añade grosor al brazo.'
    },
    {
        name: 'Curl en banco Scott',
        category: 'biceps', muscleGroup: 'Bíceps braquial',
        difficulty: 'media',
        description: 'Brazos apoyados en el soporte inclinado. Elimina el impulso del cuerpo, aislando completamente el bíceps. Baja hasta casi la extensión total.'
    },
    {
        name: 'Curl en polea baja',
        category: 'biceps', muscleGroup: 'Bíceps braquial',
        difficulty: 'baja',
        description: 'Tensión constante durante todo el recorrido. Agarre supino o con cuerda para variante de martillo. Ideal para el pico del bíceps.'
    },
    {
        name: 'Curl concentrado',
        category: 'biceps', muscleGroup: 'Pico del bíceps',
        difficulty: 'baja',
        description: 'Sentado, codo apoyado en la cara interna del muslo. Máxima concentración en un solo brazo. Supina la muñeca al llegar arriba.'
    },
    {
        name: 'Curl con barra Z (EZ)',
        category: 'biceps', muscleGroup: 'Bíceps / Braquiorradial',
        difficulty: 'baja',
        description: 'La barra Z reduce la tensión en las muñecas. Buen ejercicio para volumen manteniendo comodidad articular.'
    },
    {
        name: 'Curl inclinado con mancuernas',
        category: 'biceps', muscleGroup: 'Cabeza larga del bíceps',
        difficulty: 'media',
        description: 'Banco inclinado 45-60°. Los brazos cuelgan detrás del cuerpo aumentando el estiramiento de la cabeza larga del bíceps.'
    },

    // ── TRÍCEPS ────────────────────────────────────────────────────────────
    {
        name: 'Fondos en paralelas (tríceps)',
        category: 'triceps', muscleGroup: 'Tríceps braquial',
        difficulty: 'media',
        description: 'En paralelas, torso vertical y codos pegados. Baja hasta ~90° y empuja hasta extender los brazos. Mayor activación del tríceps que la versión pecho.'
    },
    {
        name: 'Press francés con barra Z',
        category: 'triceps', muscleGroup: 'Cabeza larga del tríceps',
        difficulty: 'media',
        description: 'Tumbado en banco, barra EZ sobre la frente. Flexiona los codos hacia atrás y extiende. Codos apuntando al techo en todo momento.'
    },
    {
        name: 'Extensión de tríceps en polea',
        category: 'triceps', muscleGroup: 'Tríceps braquial',
        difficulty: 'baja',
        description: 'De pie frente a polea alta con barra recta o cuerda. Empuja hacia abajo extendiendo los codos. Codos fijos al costado durante todo el movimiento.'
    },
    {
        name: 'Extensión sobre la cabeza con mancuerna',
        category: 'triceps', muscleGroup: 'Cabeza larga del tríceps',
        difficulty: 'baja',
        description: 'De pie o sentado, mancuerna con ambas manos detrás de la cabeza. Extiende los codos hacia arriba. Máxima activación de la cabeza larga.'
    },
    {
        name: 'Patada de tríceps',
        category: 'triceps', muscleGroup: 'Cabeza lateral del tríceps',
        difficulty: 'baja',
        description: 'Inclinado con mancuerna. Codo a 90° pegado al costado. Extiende el brazo hacia atrás hasta quedar paralelo al suelo. Contrae al final.'
    },
    {
        name: 'Fondos en banco',
        category: 'triceps', muscleGroup: 'Tríceps braquial',
        difficulty: 'baja',
        description: 'Manos en el borde de un banco detrás de ti, pies al frente. Baja doblando los codos y sube empujando. Versión accesible sin equipamiento.'
    },
    {
        name: 'Press cerrado con barra',
        category: 'triceps', muscleGroup: 'Tríceps braquial',
        difficulty: 'media',
        description: 'Tumbado en banco, agarre estrecho (~20 cm). Codos pegados al bajar. Gran ejercicio de fuerza para el tríceps con posibilidad de mucha carga.'
    },
    {
        name: 'Extensión unilateral en polea sobre la cabeza',
        category: 'triceps', muscleGroup: 'Cabeza larga del tríceps',
        difficulty: 'baja',
        description: 'Polea alta, un brazo detrás de la cabeza. Extiende hacia arriba. Trabaja la cabeza larga en posición elongada.'
    },

    // ── CUÁDRICEPS ─────────────────────────────────────────────────────────
    {
        name: 'Sentadilla con barra',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos',
        difficulty: 'media',
        description: 'Barra en la espalda alta o baja. Pies a la anchura de hombros, punta de pies ligeramente hacia afuera. Desciende hasta paralelo manteniendo el pecho alto.'
    },
    {
        name: 'Prensa de piernas',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos',
        difficulty: 'baja',
        description: 'En la máquina de prensa. Pies a la anchura de caderas. Baja controlando hasta 90° y empuja sin bloquear las rodillas en extensión.'
    },
    {
        name: 'Extensión de cuádriceps en máquina',
        category: 'piernas', muscleGroup: 'Cuádriceps',
        difficulty: 'baja',
        description: 'Sentado en la máquina de extensiones. Extiende las rodillas contrayendo el cuádriceps al final. Controla la bajada para proteger la rodilla.'
    },
    {
        name: 'Sentadilla frontal',
        category: 'piernas', muscleGroup: 'Cuádriceps',
        difficulty: 'alta',
        description: 'Barra en la clavícula, codos altos. Postura más vertical que la sentadilla trasera. Mayor demanda de movilidad en tobillos y muñecas.'
    },
    {
        name: 'Zancadas con mancuernas',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos',
        difficulty: 'baja',
        description: 'Un paso largo hacia delante, rodilla trasera baja hasta casi tocar el suelo. Alterna piernas. Mantén el torso erguido y el core activo.'
    },
    {
        name: 'Sentadilla búlgara',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos',
        difficulty: 'media',
        description: 'Pie trasero elevado en banco. Baja la rodilla trasera hacia el suelo doblando la rodilla delantera. Gran ejercicio unilateral de fuerza.'
    },
    {
        name: 'Sentadilla sumo',
        category: 'piernas', muscleGroup: 'Aductores / Cuádriceps / Glúteos',
        difficulty: 'baja',
        description: 'Pies muy separados, puntas hacia afuera. Desciende manteniendo las rodillas alineadas con los pies. Mayor activación del interior de muslo.'
    },
    {
        name: 'Step-up con mancuernas',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos',
        difficulty: 'baja',
        description: 'Sube a un escalón o banco alternando piernas con mancuernas en las manos. Apoya todo el pie en el escalón para enfatizar el glúteo.'
    },

    // ── ISQUIOTIBIALES ─────────────────────────────────────────────────────
    {
        name: 'Peso muerto rumano',
        category: 'piernas', muscleGroup: 'Isquiotibiales / Glúteos',
        difficulty: 'media',
        description: 'De pie, barra colgando. Inclina el torso hacia delante empujando la cadera hacia atrás, piernas casi rectas. Siente el estiramiento de los isquios y sube.'
    },
    {
        name: 'Curl femoral tumbado',
        category: 'piernas', muscleGroup: 'Isquiotibiales',
        difficulty: 'baja',
        description: 'Tumbado boca abajo en la máquina. Flexiona las rodillas llevando los talones hacia los glúteos. Controla el descenso. Aísla perfectamente el bíceps femoral.'
    },
    {
        name: 'Curl femoral sentado',
        category: 'piernas', muscleGroup: 'Isquiotibiales',
        difficulty: 'baja',
        description: 'Versión sentada de la máquina de curl. Permite mayor rango de movimiento inicial. Útil como variante para evitar monotonía.'
    },
    {
        name: 'Buenos días',
        category: 'piernas', muscleGroup: 'Isquiotibiales / Erector espinal',
        difficulty: 'media',
        description: 'Barra en espalda alta, piernas semi-flexionadas. Inclínate hacia delante desde la cadera hasta casi horizontal. Sube contrayendo isquios y glúteos.'
    },
    {
        name: 'Peso muerto a una pierna',
        category: 'piernas', muscleGroup: 'Isquiotibiales / Glúteos',
        difficulty: 'media',
        description: 'Sobre una pierna con mancuerna en la mano contraria. Baja el torso hacia delante manteniendo la espalda neutra. Mejora el equilibrio y la fuerza unilateral.'
    },
    {
        name: 'Curl nórdico',
        category: 'piernas', muscleGroup: 'Isquiotibiales',
        difficulty: 'alta',
        description: 'Rodillas en el suelo, tobillos sujetos. Cae hacia delante controlando con los isquios. Ejercicio excéntrico muy efectivo para prevenir lesiones.'
    },

    // ── GLÚTEOS ────────────────────────────────────────────────────────────
    {
        name: 'Hip thrust con barra',
        category: 'piernas', muscleGroup: 'Glúteo mayor',
        difficulty: 'media',
        description: 'Espalda apoyada en banco, barra sobre las caderas. Empuja las caderas hacia arriba contrayendo el glúteo en la posición alta. El rey del glúteo.'
    },
    {
        name: 'Patada trasera en polea',
        category: 'piernas', muscleGroup: 'Glúteo mayor',
        difficulty: 'baja',
        description: 'De pie frente a la polea baja. Extiende una pierna hacia atrás contrayendo el glúteo. Mantén la espalda neutra y el core activo.'
    },
    {
        name: 'Abducción de cadera en máquina',
        category: 'piernas', muscleGroup: 'Glúteo mediano',
        difficulty: 'baja',
        description: 'Sentado en la máquina, abre las piernas hacia afuera venciendo la resistencia. Activa el glúteo medio, fundamental para la estabilidad de cadera.'
    },
    {
        name: 'Sentadilla con salto',
        category: 'piernas', muscleGroup: 'Glúteos / Cuádriceps',
        difficulty: 'media',
        description: 'Sentadilla completa y al subir explota saltando. Aterriza suavemente volviendo directo a la sentadilla. Potencia y condición física.'
    },
    {
        name: 'Glute bridge',
        category: 'piernas', muscleGroup: 'Glúteo mayor',
        difficulty: 'baja',
        description: 'Tumbado boca arriba, rodillas dobladas. Eleva las caderas apretando el glúteo en la posición alta. Versión sin equipamiento del hip thrust.'
    },

    // ── GEMELOS ────────────────────────────────────────────────────────────
    {
        name: 'Elevación de talones de pie (gemelo)',
        category: 'piernas', muscleGroup: 'Gastrocnemio',
        difficulty: 'baja',
        description: 'De pie en el borde de un escalón o en máquina. Sube de puntillas lo máximo posible y baja hasta el estiramiento completo del gemelo.'
    },
    {
        name: 'Elevación de talones sentado (sóleo)',
        category: 'piernas', muscleGroup: 'Sóleo',
        difficulty: 'baja',
        description: 'Sentado con rodillas a 90°. La flexión de rodilla relaja el gastrocnemio activando más el sóleo. Imprescindible para un desarrollo completo de la pantorrilla.'
    },
    {
        name: 'Elevación de talones con una pierna',
        category: 'piernas', muscleGroup: 'Gemelo (unilateral)',
        difficulty: 'media',
        description: 'Igual que la elevación bilateral pero sobre una sola pierna. Aumenta la carga y el rango de movimiento. Se puede hacer sin equipamiento.'
    },

    // ── CORE / ABDOMEN ─────────────────────────────────────────────────────
    {
        name: 'Plancha isométrica',
        category: 'core', muscleGroup: 'Core completo',
        difficulty: 'baja',
        description: 'Apoyado en antebrazos y pies. Cuerpo en línea recta de talones a cabeza. Contrae el abdomen y los glúteos. Aguanta el tiempo programado sin caer.'
    },
    {
        name: 'Plancha lateral',
        category: 'core', muscleGroup: 'Oblicuos / Core lateral',
        difficulty: 'baja',
        description: 'Apoyo en un antebrazo, cuerpo lateral alineado. Trabaja el oblicuo externo e interno y el cuadrado lumbar. Alterna ambos lados.'
    },
    {
        name: 'Crunch abdominal',
        category: 'core', muscleGroup: 'Recto abdominal',
        difficulty: 'baja',
        description: 'Tumbado boca arriba, rodillas dobladas. Eleva los hombros del suelo contrayendo el abdomen. Evita tirar del cuello con las manos.'
    },
    {
        name: 'Elevación de piernas colgado',
        category: 'core', muscleGroup: 'Recto abdominal inferior',
        difficulty: 'alta',
        description: 'Colgado de una barra. Sube las piernas rectas (o dobladas) hasta la horizontal. Ejercicio muy exigente que requiere buena fuerza de agarre.'
    },
    {
        name: 'Rueda abdominal (ab wheel)',
        category: 'core', muscleGroup: 'Core completo',
        difficulty: 'alta',
        description: 'Rodillas en el suelo, rueda frente a ti. Extiéndete hacia delante controlando y vuelve a la posición inicial con el abdomen. Uno de los mejores ejercicios de core.'
    },
    {
        name: 'Russian twist',
        category: 'core', muscleGroup: 'Oblicuos',
        difficulty: 'baja',
        description: 'Sentado con los pies elevados, torso inclinado 45°. Rota el torso de lado a lado tocando el suelo con las manos o un disco. Trabaja los oblicuos.'
    },
    {
        name: 'Dead bug',
        category: 'core', muscleGroup: 'Core estabilizador',
        difficulty: 'baja',
        description: 'Tumbado boca arriba, brazos y rodillas a 90°. Extiende el brazo y la pierna contraria simultáneamente sin perder el contacto lumbar con el suelo.'
    },
    {
        name: 'Mountain climbers',
        category: 'core', muscleGroup: 'Core / Cardio',
        difficulty: 'media',
        description: 'En posición de plancha alta. Alterna llevar las rodillas hacia el pecho rápidamente. Trabaja el core y eleva la frecuencia cardíaca.'
    },
    {
        name: 'Hollow hold',
        category: 'core', muscleGroup: 'Core completo',
        difficulty: 'media',
        description: 'Tumbado boca arriba, eleva hombros y piernas del suelo formando una "U" invertida. Mantén la posición con el abdomen completamente contraído.'
    },
    {
        name: 'Pallof press',
        category: 'core', muscleGroup: 'Core anti-rotación',
        difficulty: 'media',
        description: 'De lado a una polea. Empuja el agarre hacia delante resistiendo la rotación. Excelente ejercicio de estabilidad y prevención de lesiones lumbares.'
    },

    // ── CARDIO ─────────────────────────────────────────────────────────────
    {
        name: 'Burpees',
        category: 'cardio', muscleGroup: 'Cuerpo completo',
        difficulty: 'alta',
        description: 'Desde de pie: baja a sentadilla, apoya las manos, salta a plancha, flexión opcional, salta a sentadilla y salta arriba con los brazos al techo.'
    },
    {
        name: 'Salto a la comba',
        category: 'cardio', muscleGroup: 'Gemelos / Coordinación',
        difficulty: 'baja',
        description: 'Salta con una cuerda de comba manteniendo un ritmo constante. Excelente para el sistema cardiovascular y la coordinación. Empieza a ritmo suave.'
    },
    {
        name: 'Jumping jacks',
        category: 'cardio', muscleGroup: 'Cuerpo completo',
        difficulty: 'baja',
        description: 'Salta abriendo piernas y subiendo brazos simultáneamente, luego vuelve a la posición inicial. Ideal para calentar o como ejercicio de cardio ligero.'
    },
    {
        name: 'Carrera en cinta o al aire libre',
        category: 'cardio', muscleGroup: 'Cardiovascular',
        difficulty: 'baja',
        description: 'Carrera continua a ritmo moderado. Mantén una postura erguida, hombros relajados y zancada natural. La duración e intensidad varían según el objetivo.'
    },
    {
        name: 'Intervals en bicicleta estática',
        category: 'cardio', muscleGroup: 'Cardiovascular / Piernas',
        difficulty: 'media',
        description: 'Alterna 20-30 segundos de pedaleo intenso con 40-60 segundos de recuperación activa. El HIIT en bicicleta es muy eficiente para quemar calorías.'
    },
    {
        name: 'Remo en máquina (ergómetro)',
        category: 'cardio', muscleGroup: 'Cuerpo completo',
        difficulty: 'media',
        description: 'Empuja con las piernas primero, luego reclina el torso y tira de los brazos. 60% piernas, 20% torso, 20% brazos. Gran ejercicio de cardio total body.'
    },
    {
        name: 'Sprints',
        category: 'cardio', muscleGroup: 'Cardiovascular / Tren inferior',
        difficulty: 'alta',
        description: 'Carreras cortas (20-60 m) al máximo esfuerzo con recuperación completa entre series. Muy efectivos para mejorar potencia y composición corporal.'
    },
    {
        name: 'Battle ropes',
        category: 'cardio', muscleGroup: 'Hombros / Core / Cardiovascular',
        difficulty: 'media',
        description: 'Con las cuerdas en las manos, genera ondas alternas o simultáneas. Exigente para el sistema cardiovascular y la fuerza resistencia del tren superior.'
    },
    {
        name: 'Escaladora (stepper)',
        category: 'cardio', muscleGroup: 'Glúteos / Cardiovascular',
        difficulty: 'baja',
        description: 'Simula subir escaleras de forma continua. Baja impacto articular y alta demanda cardíaca. Mantén una ligera inclinación hacia delante.'
    },
    {
        name: 'Box jumps',
        category: 'cardio', muscleGroup: 'Glúteos / Cuádriceps / Cardiovascular',
        difficulty: 'media',
        description: 'Salta sobre un cajón o plataforma con ambos pies. Aterriza suavemente doblando rodillas. Trabaja la potencia del tren inferior y la condición física.'
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
    console.log(`📊 Resultado:`);
    console.log(`   Ejercicios nuevos insertados : ${inserted}`);
    console.log(`   Ya existían (sin cambios)    : ${skipped}`);
    console.log(`   Total en la base de datos    : ${total}`);

    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
