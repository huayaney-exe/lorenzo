# Lorenzo Active Hub: Lineamientos de Identidad y Branding Digital

## 1. ADN de la Marca y Posicionamiento

Lorenzo Active Hub se distancia radicalmente del concepto de club deportivo tradicional. Es una intersección entre una galería en constante ensayo, una bitácora fotográfica y un enclave deportivo. Gestado por mentes artísticas, el espacio exige una presencia digital que respire rigor estético, intencionalidad arquitectónica en crudo y nostalgia costera sin pretensiones.

**Slogan principal:** "vive la punta como local"

El tono de voz es directo, documental y anclado a La Punta. Se omite el lenguaje publicitario efusivo; la comunicación se asemeja a las notas de un diario visual de obra o el manifiesto de un proyecto artístico independiente.

## 2. Dirección de Arte y Estética Visual ("Brutalismo Costero Curado")

El concepto visual no persigue lo "impoluto" del diseño minimalista de Silicon Valley, sino que expone el proceso: crudo, contrastado y estructurado orgánicamente. 

### 2.1 Paleta de Color Inquebrantable
- **Rojo Lorenzo (Primario):** `#960800`.
  Un rojo de almagre profundo, carmesí oscuro / sangre de toro. Evoca muros pintados a brocha, ladrillo expuesto al sol de la costa y la sobriedad clásica de las puertas coloniales. Se usa en grandes bloques de color como divisor o marco, así como en piezas interactivas de gran peso.
- **Grises Industriales y Blancos Hueso:** Fondos asfálticos o cemento pulido. Las tipografías en negativo (blanco) sobre el Rojo Lorenzo crean el contraste estelar de la identidad. 
- **Azul "Painter's Tape" (Acento secundario sutil):** Para demarcaciones crudas. El azul estructural de la cinta de pintor azul (observada en las referencias para pegar fotos en la pared blanca) puede ser un minúsculo Easter Egg en la UI.

### 2.2 Tipografía (El peso del mensaje)
Se observa un uso dominante y audaz de tipografías grotescas modernas (ej. "EL PUNTO DE ENCUENTRO QUE ESTABAS ESPERANDO ESTÁ TOMANDO FORMA.").

- **Títulos y Statements (Grotesca Extensa / Display):** 
  Fuentes como Monument Grotesk, Pangram Sans o Neue Haas Grotesk. En la UI digital, las frases impactantes (statements) deben ir *ALL CAPS* y con tracking generoso, imitando la rotulación artesanal sobre una puerta de madera. Textos en rojo oscuro sobre gris o blanco rotundo sobre rojo profundo.
- **El Logo:** La intervención del logo ("LORENZO" con una E ondulante en ritmo marino) dicta que la abstracción geométrica es bienvenida solo cuando tiene propósito literal (el mar, el oleaje).

## 3. UI y Experiencia Digital (Bento Design y Materialidad)

La UI no debe sentirse como software puro, sino como objetos ensamblados, mampostería e industria digital.

### 3.1 Cajas y Mampostería (Tiles)
- **Bordes Contundentes:** En vez de suaves neomorfismos y sombras cliches, usar delineados sólidos de 1px a 2px en gris intermedio o negro apagado para separar secciones (`solid rgba(0,0,0,0.15)`).
- **Inicios Crudos:** Evitar la moda actual de bordes hiper-redondeados. Utilizar radios de 2px a 4px como máximo para aludir a esquinas de ladrillos o cajas arquitectónicas; firmeza y peso. 
- **Etiquetas y Señalética:** Como en una obra en construcción o sala de máquinas (Acceso con huella, zona de paletas), emplear badges contrastados con tipografía minúscula o mayúscula en negrita (uppercase bold) acompañada de flechas minimalistas trazadas a mano (hand-drawn arrows, como en la referencia de "SWIPE").

### 3.2 Microanimaciones (Spring Physics en baja frecuencia)
- **Peso Industrial:** Cuando se interactúa con un elemento, la animación no debe ser esponjosa ni etérea. Las físicas de resorte (spring) deben ser tensas, secas.
- **El Estado Hover (Feedback táctil):** Al posar el cursor o hacer _tap_, evite el "lift" con sombras (Box shadow lift genérico). Preferir un sutil relleno oscuro del tile (_color fill_) o un ligerísimo `scale(0.98)` hacia adentro para dar la sensación física de pulsar un interruptor mecánico en la pared roja o en la cerradura biométrica de la obra.
- **Revelación Documental:** Carga de imágenes con ruido / _grain_ sutil previo, como revelando película fotográfica o secando cemento fresco. No "blur-up" típico.

## 4. Fotografía e Imaginería (La Verdad Cruda)

El núcleo estético más potente de Lorenzo radica en su fotografía. Absolutamente zero _stock photography_. 

- **El Enfoque "Making-of" / Obra Negra:** Planos de detalle a muros resanados, carretillas en patio enladrillado rojo, cemento sin pulir, el polvo, un hombre cargando un saco. Esto comunica el esfuerzo y el espíritu fundacional (grassroots) que hay detrás de Lorenzo. Trasladar esta sinceridad a la app: que parezca el archivo fotográfico del proyecto y no tanto el producto terminado.
- **La Costa Cotidiana:** Planos estéticos pero sinceros. Un perro ("Lolo"/Mascota de Lorenzo) en el bote, rostros reales o el caos organizado de calles de La Punta o la camioneta en la vía. Tienen un _color grading_ analógico (alta densidad de negros, contrastes agudos, poco filtro de saturación y cierta "baja fidelidad" premeditada).
- **Recursos "Collage" / Tape:** Utilizar el pegado conceptual de fotos con "cinta azul de pintor" o flechas blancas trazadas a trazo rústico (como la indicación hacia la huella digital en las referencias) sobre la UI, lo cual añade carisma humano, curatorial y editorial sobre fondos muy planos.

## 5. Arquitectura de la Información (IA) y Escalabilidad

Lorenzo Active Hub es un organismo vivo que comienza operativamente con el **Paddle**, pero su infraestructura digital debe soportar la incubación de nuevas disciplinas, eventos culturales y servicios curatoriales a futuro.

- **Servicios Modulares en Grilla:** El diseño debe prever que "Paddle" sea únicamente el primer bloque (`tile`) activado de un ecosistema mayor. Los futuros módulos (Café, Galería, Exámenes Físicos) se integrarán en la misma cuadrícula de mampostería.
- **Acceso Directo y "Concierge":** Frente a la burocracia de los formularios interminables, Lorenzo opta por el trato humano y la fricción cero.
  - **Redirect Principal:** El ancla de contacto y reservas derivará directamente a WhatsApp.
  - **Línea Oficial:** `+51 944 629 513` (manteniendo el servicio como un "local" dándote el pase al club).
- **Idioma y Audiencia (ES / EN):** La Punta atrae tanto a la comunidad chalaca y limeña como a visitantes internacionales. El sitio **debe** presentar contenido dual (Español e Inglés) y permitir la selección de idioma (ej. un *toggle* tipográfico crudo `[ ES / EN ]` en el header o navbar), prohibiendo traducciones robóticas incrustadas.

## 6. Planificación Estructural de la Landing Page

La Vista Principal (`Landing Page`) abandona el paradigma genérico del funnel de software (SaaS) y asume un comportamiento de "póster interactivo editorial y funcional".

### Desglose de Bloques (Bento Design / Mampostería):
1. **Hero Asimétrico (Above the Fold):** 
   - Supresión del texto centrado sobre una imagen de fondo oscurecida (cliché inaceptable).
   - *Alternativa:* Una división dura. A un lado, un gran lienzo tipográfico bloqueado con el dogma "VIVE LA PUNTA COMO LOCAL" (Grotesca Extensa en `UPPERCASE`). Al otro lado, una fotografía a sangre (composición fotoperiodística) recortada geométricamente.
2. **Selector Dimensional de Disciplina (Acceso al Paddle):**
   - El tile de mayor urgencia, bañado en **Rojo Lorenzo (#960800)**, enfocado en el Paddle. Microcopy: "Turnos y Canchas" u "Horarios" (En lugar de "Cómpralo ahora").
3. **Módulo Fotográfico Documental (El Ojo del Curador):**
   - Una grilla desordenada o deslizador (con físicas de resorte pesadas) que revele la materialidad de la obra y el proyecto: acercamientos a carretillas, malla de las canchas, arena, la puerta de madera antigua, o Lolo en el bote. 
   - *Adorno:* Aquí es idóneo aplicar el "Easter Egg" de la tira de "cinta de pintor azul" anclando alguna foto, aportando esa capa humana al recuadro.
4. **Colofón / Footer Utilitario:**
   - Inspirado en la ficha técnica de una exposición de arte. Tipografía de tamaño mínimo (monoespaciada o grotesca fina). 
   - Incluye: Dirección postal de La Punta, hipervínculos austeros (Instagram) y el enlace directo al WhatsApp `+51 944 629 513` muy visible, junto al selector de idiomas `ES / EN`.

## 7. Guardrails Estrictos (Anti AI-Slop y Taste Curatorial)

El riesgo intrínseco de construir software rápido hoy es la "contaminación por IA". Lorenzo repudia lo artificial; estas son las prohibiciones absolutas:

- **Imágenes: 100% Realidad Documental:** Ni una sola textura, vector de fondo, "paisaje generado" o imagen de relleno puede provenir de IA (Midjourney / DALL-E / Etc.). La identidad de Lorenzo recae en la costa real, el salitre, los rostros peruanos y los materiales capturados por una lente.
- **Copywriting y Tono de Voz:** Cero "Slop". Se prohíbe el uso de lenguaje derivativo de LLMs, repleto de adjetivos huecos ("Descubre nuestra increíble experiencia transformadora"). La redacción debe estar sujeta a un altísimo *taste* editorial: poética, concisa, técnica cuando debe serlo y sin un solo emoji.
- **Iconografía Cruda, no de Stock:** Descartar colecciones de íconos vectoriales redondos y amistosos (FontAwesome, Lucide normalizado). Si se requiere indicar una acción (flujo, arrastre, huella), se recomiendan trazos irregulares como dibujados a mano, similares a las indicaciones de tiza blanca vistas en las fotografías de la obra.
- **Tensión del Silencio Visual:** Si una sección no amerita ilustración o texto, se permite el bloque de color puro (Rojo, Gris asfalto o Hueso crudo). No rellenar vacíos con patrones de malla (mesh gradients) u olas vectoriales genéricas.
