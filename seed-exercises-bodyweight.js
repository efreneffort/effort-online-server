// Ejercicios sin material — solo peso corporal
// Ejecutar: node seed-exercises-bodyweight.js
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
        name: 'Flexiones inclinadas (manos elevadas)',
        category: 'pecho', muscleGroup: 'Pectoral inferior',
        difficulty: 'baja',
        description: 'Manos apoyadas en una silla, mesa o escalón. Cuanto más elevada la superficie, más fácil el ejercicio. Ideal como progresión hacia la flexión estándar.'
    },
    {
        name: 'Flexiones diamante',
        category: 'pecho', muscleGroup: 'Pectoral interno / Tríceps',
        difficulty: 'media',
        description: 'Manos juntas formando un rombo bajo el pecho. Codos se abren ligeramente al bajar. Activa el pectoral interno y el tríceps de forma intensa.'
    },
    {
        name: 'Flexiones arquero',
        category: 'pecho', muscleGroup: 'Pectoral mayor (unilateral)',
        difficulty: 'alta',
        description: 'Manos muy separadas. Al bajar desplaza el peso hacia un lado estirando el brazo contrario casi recto. Alterna lados. Progresión hacia la flexión a un brazo.'
    },
    {
        name: 'Flexiones con palmada',
        category: 'pecho', muscleGroup: 'Pectoral / Potencia',
        difficulty: 'alta',
        description: 'Empuja con fuerza explosiva hasta que las manos despeguen del suelo, da una palmada y vuelve a apoyar. Desarrolla potencia en el tren superior.'
    },
    {
        name: 'Flexiones lentas (tempo 4-0-4)',
        category: 'pecho', muscleGroup: 'Pectoral mayor',
        difficulty: 'media',
        description: 'Baja en 4 segundos, sube en 4 segundos sin pausa. El tiempo bajo tensión maximiza la hipertrofia sin añadir carga. Variante muy eficaz con solo el peso corporal.'
    },
    {
        name: 'Flexiones a un brazo (asistida)',
        category: 'pecho', muscleGroup: 'Pectoral mayor (unilateral)',
        difficulty: 'alta',
        description: 'Un brazo en el suelo, el otro sobre un balón medicinal o puño. Progresión hacia la flexión a un brazo completa. Enorme demanda de fuerza unilateral.'
    },
    {
        name: 'Flexiones con pies elevados',
        category: 'pecho', muscleGroup: 'Pectoral superior',
        difficulty: 'media',
        description: 'Pies sobre una silla o escalón. El torso queda inclinado hacia abajo activando más el pectoral superior. Equivalente sin material al press inclinado.'
    },
    {
        name: 'Flexiones en pico (pike push-up)',
        category: 'pecho', muscleGroup: 'Pectoral / Deltoides anterior',
        difficulty: 'media',
        description: 'Caderas muy elevadas formando una "V" invertida. Al bajar la cabeza entre las manos activa el pectoral superior y los deltoides. Transición al handstand push-up.'
    },

    // ── ESPALDA ────────────────────────────────────────────────────────────
    {
        name: 'Superman',
        category: 'espalda', muscleGroup: 'Erector espinal / Glúteos',
        difficulty: 'baja',
        description: 'Tumbado boca abajo, eleva brazos y piernas del suelo simultáneamente. Mantén 2 segundos en la posición alta. Fortalece la cadena posterior completa sin material.'
    },
    {
        name: 'Superman alterno (pájaro-perro)',
        category: 'espalda', muscleGroup: 'Erector espinal / Core',
        difficulty: 'baja',
        description: 'En cuadrupedia, extiende simultáneamente el brazo derecho y la pierna izquierda. Mantén 2 segundos y alterna. Trabaja la estabilidad lumbar y la cadena posterior.'
    },
    {
        name: 'Extensión de espalda en suelo',
        category: 'espalda', muscleGroup: 'Erector espinal',
        difficulty: 'baja',
        description: 'Tumbado boca abajo, manos en la nuca o a los lados. Eleva solo el torso del suelo contrayendo los lumbares. Sin los pies fijos es más exigente.'
    },
    {
        name: 'Nadador en suelo',
        category: 'espalda', muscleGroup: 'Cadena posterior completa',
        difficulty: 'media',
        description: 'Tumbado boca abajo, alterna la elevación de brazo y pierna contraria de forma rápida simulando una brazada. Activa la cadena posterior con componente cardio.'
    },
    {
        name: 'Remo con toalla en puerta',
        category: 'espalda', muscleGroup: 'Dorsal / Bíceps',
        difficulty: 'baja',
        description: 'Enrolla una toalla en el pomo de una puerta cerrada. Con los pies apoyados en la puerta y el cuerpo inclinado, tira de la toalla llevando el pecho hacia la puerta.'
    },
    {
        name: 'Buenos días con peso corporal',
        category: 'espalda', muscleGroup: 'Isquiotibiales / Erector espinal',
        difficulty: 'baja',
        description: 'De pie, manos en la nuca. Inclínate hacia delante desde la cadera manteniendo la espalda neutra. Siente el estiramiento de los isquios. Sube contrayendo glúteos.'
    },
    {
        name: 'Hiperextensión en suelo (cobras)',
        category: 'espalda', muscleGroup: 'Erector espinal',
        difficulty: 'baja',
        description: 'Tumbado boca abajo, manos cerca del pecho. Empuja el torso hacia arriba arqueando la espalda como la postura del yoga "cobra". Estira y fortalece la columna.'
    },

    // ── HOMBROS ────────────────────────────────────────────────────────────
    {
        name: 'Flexión de pino asistida',
        category: 'hombros', muscleGroup: 'Deltoides / Tríceps',
        difficulty: 'alta',
        description: 'Pies apoyados en la pared en posición invertida, baja la cabeza hacia el suelo y sube. Versión asistida del handstand push-up. Alta demanda de fuerza y equilibrio.'
    },
    {
        name: 'Toque de hombros en plancha',
        category: 'hombros', muscleGroup: 'Deltoides / Core anti-rotación',
        difficulty: 'media',
        description: 'En plancha alta, toca el hombro contrario con una mano mientras la otra soporta el peso. Alterna sin mover las caderas. Fuerza de hombro y estabilidad de core.'
    },
    {
        name: 'Círculos de brazo',
        category: 'hombros', muscleGroup: 'Deltoides / Manguito rotador',
        difficulty: 'baja',
        description: 'Brazos extendidos a los lados. Realiza círculos pequeños hacia delante 30 segundos y hacia atrás 30 segundos. Activa el manguito rotador y mejora la movilidad.'
    },
    {
        name: 'Y-T-W en suelo',
        category: 'hombros', muscleGroup: 'Trapecio inferior / Deltoides posterior',
        difficulty: 'baja',
        description: 'Tumbado boca abajo. Eleva los brazos formando las letras Y, T y W alternativamente. Esencial para la salud del hombro y la postura. Sin ningún material.'
    },
    {
        name: 'Flexión de pino completa (handstand push-up)',
        category: 'hombros', muscleGroup: 'Deltoides / Tríceps',
        difficulty: 'alta',
        description: 'En posición de pino invertido contra la pared. Baja la cabeza hasta el suelo y sube. Uno de los ejercicios de hombro más exigentes con peso corporal.'
    },

    // ── BÍCEPS ─────────────────────────────────────────────────────────────
    {
        name: 'Curl isométrico con mano contraria',
        category: 'biceps', muscleGroup: 'Bíceps braquial',
        difficulty: 'baja',
        description: 'Coloca la palma de una mano sobre el dorso de la contraria. Intenta flexionar el codo mientras resistes con la mano de arriba. Mantén 5-10 segundos. Sin material alguno.'
    },
    {
        name: 'Curl con mochila',
        category: 'biceps', muscleGroup: 'Bíceps braquial',
        difficulty: 'baja',
        description: 'Usa una mochila cargada de libros como resistencia. Perfecta alternativa casera para entrenar el bíceps con carga progresiva sin equipamiento de gimnasio.'
    },
    {
        name: 'Curl en barra de dominadas (supino)',
        category: 'biceps', muscleGroup: 'Bíceps braquial',
        difficulty: 'media',
        description: 'Cuelga de una barra fija con agarre supino. Flexiona los codos llevando la barbilla por encima de la barra. El bíceps trabaja como motor principal.'
    },

    // ── TRÍCEPS ────────────────────────────────────────────────────────────
    {
        name: 'Fondos entre dos sillas',
        category: 'triceps', muscleGroup: 'Tríceps braquial',
        difficulty: 'baja',
        description: 'Igual que los fondos en banco pero con dos sillas enfrentadas para mayor rango de movimiento. Mantén el cuerpo vertical para aislar el tríceps.'
    },
    {
        name: 'Extensión de tríceps en suelo (skull crusher corporal)',
        category: 'triceps', muscleGroup: 'Tríceps braquial',
        difficulty: 'media',
        description: 'En plancha alta con manos juntas. Dobla solo los codos bajando la frente hacia el suelo y extiende. Similar al press francés pero con el peso corporal.'
    },
    {
        name: 'Flexiones de tríceps (agarre estrecho)',
        category: 'triceps', muscleGroup: 'Tríceps / Pectoral interno',
        difficulty: 'media',
        description: 'Flexiones con las manos muy juntas y los codos pegados al cuerpo al bajar. Máxima activación del tríceps comparado con cualquier variante de flexión.'
    },

    // ── CUÁDRICEPS ─────────────────────────────────────────────────────────
    {
        name: 'Sentadilla con peso corporal',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos',
        difficulty: 'baja',
        description: 'Pies a la anchura de caderas, punta de pies ligeramente hacia afuera. Desciende hasta paralelo o más profundo. Sube empujando el suelo. Base de todo entrenamiento de piernas.'
    },
    {
        name: 'Sentadilla profunda (ass to grass)',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos / Movilidad',
        difficulty: 'baja',
        description: 'Igual que la sentadilla pero descendiendo al máximo rango posible. Requiere buena movilidad de tobillo y cadera. Mejora la funcionalidad y la movilidad general.'
    },
    {
        name: 'Sentadilla en pared (wall sit)',
        category: 'piernas', muscleGroup: 'Cuádriceps',
        difficulty: 'baja',
        description: 'Espalda apoyada en la pared, muslos paralelos al suelo. Mantén la posición el tiempo programado. Ejercicio isométrico muy efectivo para los cuádriceps.'
    },
    {
        name: 'Sentadilla pistola (asistida)',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos (unilateral)',
        difficulty: 'alta',
        description: 'Sentadilla sobre una sola pierna mientras la otra queda extendida al frente. Asistida con la mano en una pared o TRX. Máxima fuerza unilateral sin material.'
    },
    {
        name: 'Sentadilla pistola completa',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos (unilateral)',
        difficulty: 'alta',
        description: 'Sentadilla completa sobre una sola pierna libre, sin asistencia. Uno de los ejercicios más exigentes de calistenia. Requiere fuerza, movilidad y equilibrio.'
    },
    {
        name: 'Sentadilla lateral',
        category: 'piernas', muscleGroup: 'Cuádriceps / Aductores',
        difficulty: 'media',
        description: 'Pies muy separados. Desciende hacia un lado doblando esa rodilla mientras la otra pierna permanece extendida. Alterna lados. Trabaja aductores y cuádriceps.'
    },
    {
        name: 'Zancada reversa',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos',
        difficulty: 'baja',
        description: 'En lugar de dar un paso hacia delante, da un paso hacia atrás. Menor impacto en la rodilla que la zancada frontal. Muy útil en rehabilitación y para principiantes.'
    },
    {
        name: 'Zancada lateral',
        category: 'piernas', muscleGroup: 'Aductores / Cuádriceps',
        difficulty: 'baja',
        description: 'Da un paso amplio hacia un lado, dobla esa rodilla y lleva la cadera hacia atrás. La pierna contraria permanece recta. Trabaja el plano frontal que suele olvidarse.'
    },
    {
        name: 'Zancada caminando',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos',
        difficulty: 'baja',
        description: 'Encadena zancadas hacia delante desplazándote por el espacio. Añade dificultad y componente cardio respecto a la zancada estática.'
    },
    {
        name: 'Step-up sin peso',
        category: 'piernas', muscleGroup: 'Cuádriceps / Glúteos',
        difficulty: 'baja',
        description: 'Sube a un escalón o silla resistente alternando piernas. Apoya todo el pie para enfatizar el glúteo. Excelente ejercicio funcional accesible para todos.'
    },

    // ── ISQUIOTIBIALES ─────────────────────────────────────────────────────
    {
        name: 'Peso muerto a una pierna sin peso',
        category: 'piernas', muscleGroup: 'Isquiotibiales / Glúteos',
        difficulty: 'media',
        description: 'Sobre una pierna, inclina el torso hacia delante extendiendo la pierna libre hacia atrás. Mantén la espalda neutra. Fuerza unilateral y equilibrio sin material.'
    },
    {
        name: 'Curl isquiotibial en suelo (leg curl deslizante)',
        category: 'piernas', muscleGroup: 'Isquiotibiales',
        difficulty: 'media',
        description: 'Tumbado boca arriba sobre suelo liso con calcetines o trapos bajo los talones. Eleva caderas y desliza los pies hacia atrás flexionando las rodillas. Retorna controlando.'
    },
    {
        name: 'Curl nórdico con asistencia',
        category: 'piernas', muscleGroup: 'Isquiotibiales',
        difficulty: 'alta',
        description: 'Rodillas en el suelo, tobillos bajo una silla o sofa. Baja el torso hacia delante frenando con los isquios. Si no puedes, usa las manos para asistir la subida.'
    },
    {
        name: 'Puente de glúteo con una pierna',
        category: 'piernas', muscleGroup: 'Isquiotibiales / Glúteos',
        difficulty: 'media',
        description: 'Glute bridge elevando una pierna extendida. Concentra toda la fuerza en los isquios y glúteo de la pierna de apoyo. Aumenta la demanda sin añadir carga.'
    },

    // ── GLÚTEOS ────────────────────────────────────────────────────────────
    {
        name: 'Patada trasera en cuadrupedia',
        category: 'piernas', muscleGroup: 'Glúteo mayor',
        difficulty: 'baja',
        description: 'En cuadrupedia (manos y rodillas). Extiende una pierna hacia atrás y arriba contrayendo el glúteo en la posición alta. Alterna piernas. Básico de glúteos sin material.'
    },
    {
        name: 'Patada lateral en cuadrupedia (fire hydrant)',
        category: 'piernas', muscleGroup: 'Glúteo mediano',
        difficulty: 'baja',
        description: 'En cuadrupedia. Eleva una rodilla hacia el lado como si fuera a abrir una boca de incendios. Activa el glúteo medio, fundamental para la estabilidad de cadera.'
    },
    {
        name: 'Abducción lateral tumbado',
        category: 'piernas', muscleGroup: 'Glúteo mediano / TFL',
        difficulty: 'baja',
        description: 'Tumbado de lado, pierna superior recta. Eleva la pierna hacia el techo lo máximo posible sin rotar la cadera. Baja controlando. Trabaja el glúteo medio en posición lateral.'
    },
    {
        name: 'Clamshell',
        category: 'piernas', muscleGroup: 'Glúteo mediano / Rotadores externos',
        difficulty: 'baja',
        description: 'Tumbado de lado con caderas y rodillas a 45°. Abre la rodilla superior como una almeja sin mover la pelvis. Imprescindible para la estabilidad de cadera y rodilla.'
    },
    {
        name: 'Hip thrust con peso corporal',
        category: 'piernas', muscleGroup: 'Glúteo mayor',
        difficulty: 'baja',
        description: 'Espalda en un banco o sofá, pies apoyados. Empuja las caderas hacia arriba contrayendo el glúteo. Misma mecánica que el hip thrust con barra pero solo con el peso corporal.'
    },
    {
        name: 'Sentadilla sumo con peso corporal',
        category: 'piernas', muscleGroup: 'Aductores / Glúteos',
        difficulty: 'baja',
        description: 'Pies muy separados (más que el ancho de hombros) y puntas hacia afuera. Desciende manteniendo las rodillas alineadas con los pies. Mayor activación de glúteos e interior de muslo.'
    },
    {
        name: 'Donkey kick',
        category: 'piernas', muscleGroup: 'Glúteo mayor',
        difficulty: 'baja',
        description: 'En cuadrupedia. Lleva un talón hacia el techo doblando la rodilla a 90°. Aprieta el glúteo en la posición alta. Ejercicio básico y muy efectivo para el glúteo mayor.'
    },
    {
        name: 'Glute bridge con marcha',
        category: 'piernas', muscleGroup: 'Glúteo mayor / Core',
        difficulty: 'media',
        description: 'En posición de glute bridge elevado, alterna elevar las rodillas al pecho sin que caigan las caderas. Añade estabilidad y dificultad respecto al glute bridge estático.'
    },

    // ── GEMELOS ────────────────────────────────────────────────────────────
    {
        name: 'Elevación de talones con peso corporal',
        category: 'piernas', muscleGroup: 'Gastrocnemio / Sóleo',
        difficulty: 'baja',
        description: 'De pie en el borde de un escalón. Sube de puntillas al máximo y baja hasta sentir el estiramiento completo. Sin equipamiento con solo un escalón de casa.'
    },
    {
        name: 'Elevación de talones en suelo plano',
        category: 'piernas', muscleGroup: 'Gastrocnemio',
        difficulty: 'baja',
        description: 'De pie en suelo liso. Sube de puntillas lo máximo posible y baja controlando. Sin el rango completo del escalón pero completamente sin material.'
    },
    {
        name: 'Saltos de gemelo',
        category: 'piernas', muscleGroup: 'Gastrocnemio / Potencia',
        difficulty: 'media',
        description: 'Pequeños saltos continuos solo con el impulso del tobillo, rodillas casi rectas. Trabaja la potencia y resistencia de los gemelos. Útil para corredores.'
    },

    // ── CORE / ABDOMEN ─────────────────────────────────────────────────────
    {
        name: 'Bicicleta abdominal',
        category: 'core', muscleGroup: 'Oblicuos / Recto abdominal',
        difficulty: 'baja',
        description: 'Tumbado, manos en la nuca. Acerca el codo derecho a la rodilla izquierda mientras extiendes la pierna derecha. Alterna con ritmo controlado. Activa oblicuos y recto.'
    },
    {
        name: 'Elevación de piernas en suelo',
        category: 'core', muscleGroup: 'Recto abdominal inferior',
        difficulty: 'media',
        description: 'Tumbado boca arriba, piernas rectas. Eleva las piernas hasta la vertical y baja controlando sin que toquen el suelo. Mantén la zona lumbar pegada al suelo.'
    },
    {
        name: 'Tijeras horizontales',
        category: 'core', muscleGroup: 'Recto abdominal / Flexores de cadera',
        difficulty: 'media',
        description: 'Tumbado, piernas elevadas a ~30 cm del suelo. Alterna una pierna arriba y otra abajo en movimiento de tijera. Mantén la zona lumbar pegada al suelo.'
    },
    {
        name: 'Flutter kicks',
        category: 'core', muscleGroup: 'Recto abdominal inferior / Flexores de cadera',
        difficulty: 'media',
        description: 'Tumbado, piernas ligeramente elevadas. Pequeñas patadas alternas rápidas manteniendo el core contraído. Clásico ejercicio militar para el abdomen inferior.'
    },
    {
        name: 'V-sit',
        category: 'core', muscleGroup: 'Recto abdominal / Core completo',
        difficulty: 'alta',
        description: 'Equilibrado sobre los glúteos, torso y piernas elevados formando una V. Mantén la posición isométrica el máximo posible. Requiere mucha fuerza de core.'
    },
    {
        name: 'Sit-up completo',
        category: 'core', muscleGroup: 'Recto abdominal / Flexores de cadera',
        difficulty: 'baja',
        description: 'Tumbado boca arriba, rodillas dobladas. Sube todo el torso hasta sentarte y vuelve controlando. A diferencia del crunch, implica más rango de movimiento.'
    },
    {
        name: 'Crunch con giro (oblicuo)',
        category: 'core', muscleGroup: 'Oblicuos',
        difficulty: 'baja',
        description: 'Crunch estándar pero al subir rota el torso llevando el codo hacia la rodilla contraria. Alterna lados. Activa los oblicuos con mayor eficacia que el crunch recto.'
    },
    {
        name: 'Plancha con rotación (T push-up)',
        category: 'core', muscleGroup: 'Oblicuos / Core / Hombros',
        difficulty: 'media',
        description: 'Desde plancha alta, rota el cuerpo abriendo un brazo hacia el techo formando una T. Alterna lados. Combina fuerza de hombro con estabilidad de core.'
    },
    {
        name: 'Plancha dinámica (subir y bajar)',
        category: 'core', muscleGroup: 'Core / Tríceps / Hombros',
        difficulty: 'media',
        description: 'Alterna entre plancha sobre antebrazos y plancha alta (brazos extendidos). Sube y baja controlando sin mover las caderas. Excelente variante dinámica de la plancha.'
    },
    {
        name: 'Plancha con elevación de pierna',
        category: 'core', muscleGroup: 'Core / Glúteos',
        difficulty: 'media',
        description: 'En plancha sobre antebrazos, eleva una pierna extendida 10 cm del suelo. Mantén 2 segundos y alterna. Añade demanda glútea a la plancha estándar.'
    },
    {
        name: 'Windshield wipers',
        category: 'core', muscleGroup: 'Oblicuos / Core',
        difficulty: 'alta',
        description: 'Tumbado boca arriba, brazos en cruz. Piernas elevadas a 90°. Baja las piernas juntas hacia un lado sin que toquen el suelo y vuelve al centro. Alterna lados.'
    },
    {
        name: 'Toe touches',
        category: 'core', muscleGroup: 'Recto abdominal superior',
        difficulty: 'baja',
        description: 'Tumbado, piernas perpendiculares al suelo. Estira los brazos hacia los pies contrayendo el abdomen. Mantén las piernas verticales y el movimiento controlado.'
    },
    {
        name: 'Plank saw',
        category: 'core', muscleGroup: 'Core completo / Hombros',
        difficulty: 'media',
        description: 'En plancha sobre antebrazos. Desplaza el cuerpo hacia delante y hacia atrás en pequeños movimientos manteniendo el cuerpo rígido. Activa el core de forma dinámica.'
    },

    // ── CARDIO SIN MATERIAL ────────────────────────────────────────────────
    {
        name: 'High knees',
        category: 'cardio', muscleGroup: 'Cardiovascular / Flexores de cadera',
        difficulty: 'baja',
        description: 'Carrera en el sitio elevando las rodillas al máximo hacia el pecho. Brazos en movimiento coordinado. Excelente calentamiento o ejercicio de cardio sin equipamiento.'
    },
    {
        name: 'Butt kicks',
        category: 'cardio', muscleGroup: 'Cardiovascular / Isquiotibiales',
        difficulty: 'baja',
        description: 'Carrera en el sitio llevando los talones hacia los glúteos. Activa los isquiotibiales y eleva la frecuencia cardíaca. Perfecto para calentar.'
    },
    {
        name: 'Skater jumps',
        category: 'cardio', muscleGroup: 'Glúteos / Cardiovascular / Estabilidad',
        difficulty: 'media',
        description: 'Salta lateralmente de una pierna a la otra imitando el movimiento de un patinador. Aterriza sobre una pierna con control. Trabaja el plano frontal y el equilibrio.'
    },
    {
        name: 'Tuck jumps',
        category: 'cardio', muscleGroup: 'Cardiovascular / Tren inferior',
        difficulty: 'alta',
        description: 'Salta llevando las rodillas al pecho en el aire. Aterriza suavemente doblando las rodillas. Alta intensidad y potencia. Excelente para el acondicionamiento físico.'
    },
    {
        name: 'Bear crawl',
        category: 'cardio', muscleGroup: 'Cuerpo completo / Core',
        difficulty: 'media',
        description: 'En cuadrupedia con rodillas separadas del suelo 5 cm. Avanza moviendo el brazo y la pierna contraria simultáneamente. Intenso y funcional, trabaja todo el cuerpo.'
    },
    {
        name: 'Inchworm',
        category: 'cardio', muscleGroup: 'Core / Isquiotibiales / Hombros',
        difficulty: 'media',
        description: 'De pie, inclínate tocando el suelo. Camina con las manos hasta posición de plancha, luego camina de vuelta con los pies hacia las manos. Movilidad y fuerza combinadas.'
    },
    {
        name: 'Lateral hops',
        category: 'cardio', muscleGroup: 'Gemelos / Cardiovascular',
        difficulty: 'baja',
        description: 'Pequeños saltos laterales continuos de lado a lado sobre una línea imaginaria. Bajo impacto articular. Mejora la agilidad y la reactividad del tren inferior.'
    },
    {
        name: 'Squat jumps',
        category: 'cardio', muscleGroup: 'Cardiovascular / Cuádriceps / Glúteos',
        difficulty: 'media',
        description: 'Sentadilla profunda y al subir explota en un salto vertical. Aterriza suavemente con las rodillas dobladas y vuelve directo a la sentadilla. HIIT de piernas sin material.'
    },
    {
        name: 'Speed skaters',
        category: 'cardio', muscleGroup: 'Cardiovascular / Glúteo mediano',
        difficulty: 'media',
        description: 'Movimiento lateral amplio como un patinador de velocidad. Pierna trasera se cruza detrás de la de apoyo. Trabaja el glúteo medio y el sistema cardiovascular.'
    },
    {
        name: 'Seal jacks',
        category: 'cardio', muscleGroup: 'Cardiovascular / Hombros',
        difficulty: 'baja',
        description: 'Como los jumping jacks pero los brazos se abren y cierran horizontalmente (frente al pecho). Menos impacto en hombros que los jumping jacks clásicos.'
    },
    {
        name: 'Crocodile walk',
        category: 'cardio', muscleGroup: 'Cuerpo completo',
        difficulty: 'alta',
        description: 'En posición de flexión, avanza moviendo brazo y pierna del mismo lado simultáneamente muy cerca del suelo. Enorme demanda de fuerza, coordinación y cardio.'
    },
    {
        name: 'Lateral shuffles',
        category: 'cardio', muscleGroup: 'Cardiovascular / Agilidad',
        difficulty: 'baja',
        description: 'Pasos laterales rápidos en posición atlética (rodillas ligeramente dobladas). Mejora la agilidad lateral y la reactividad. Muy usado en entrenamiento deportivo.'
    },
    {
        name: 'Paso del oso (bear hug)',
        category: 'cardio', muscleGroup: 'Cuerpo completo / Core',
        difficulty: 'media',
        description: 'Desde posición de cuclillas profunda, da pasos adelante y atrás manteniendo las manos cerca del suelo. Mejora la movilidad de cadera y el acondicionamiento general.'
    },

    // ── MOVILIDAD Y CALENTAMIENTO ──────────────────────────────────────────
    {
        name: 'World\'s greatest stretch',
        category: 'core', muscleGroup: 'Movilidad global',
        difficulty: 'baja',
        description: 'Desde zancada profunda, apoya la mano del mismo lado en el suelo, rota el torso abriendo el otro brazo hacia el techo. El estiramiento más completo que existe.'
    },
    {
        name: 'Hip 90/90',
        category: 'piernas', muscleGroup: 'Rotadores de cadera / Glúteos',
        difficulty: 'baja',
        description: 'Sentado en el suelo con ambas rodillas a 90° en planos distintos. Pasa de un lado al otro. Mejora la movilidad interna y externa de la cadera.'
    },
    {
        name: 'Thoracic spine rotation',
        category: 'espalda', muscleGroup: 'Columna torácica / Movilidad',
        difficulty: 'baja',
        description: 'En cuadrupedia, mano en la nuca. Rota el codo hacia el techo máximo posible. Mejora la movilidad torácica, fundamental para la salud postural y el rendimiento.'
    },
    {
        name: 'Ankle circles',
        category: 'piernas', muscleGroup: 'Tobillo / Movilidad',
        difficulty: 'baja',
        description: 'Sentado o de pie con una pierna elevada. Realiza círculos amplios con el tobillo en ambos sentidos. Mejora la movilidad del tobillo, clave para sentadillas profundas.'
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
    console.log('📊 Resultado:');
    console.log(`   Ejercicios nuevos insertados : ${inserted}`);
    console.log(`   Ya existían (sin cambios)    : ${skipped}`);
    console.log(`   Total en la base de datos    : ${total}`);

    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
