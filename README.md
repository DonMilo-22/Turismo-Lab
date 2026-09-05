# ✈️ Turismo Lab

> Plataforma web interactiva para el aprendizaje de terminología utilizada en el sector turístico.

**Turismo Lab** es una aplicación web educativa diseñada para estudiantes de turismo. Su objetivo es facilitar el aprendizaje y la práctica de conceptos relacionados con el **abecedario fonético aeronáutico**, **claves de ciudades**, **terminología hotelera** y **abreviaturas utilizadas en hotelería**, mediante una interfaz sencilla, interactiva y agradable.

🌐 **Sitio web:** https://turismolab.vercel.app

---

## 📚 Contenido

Turismo Lab está dividido en cuatro áreas principales:

### ✈️ Abecedario aeronáutico

Permite aprender la relación entre cada letra y su término correspondiente del abecedario fonético.

Incluye:

- Tarjetas de estudio.
- Pronunciación de términos.
- Preguntas de relación letra ↔ término.
- Juego de memorama.
- Juego para descifrar códigos.
- Juego de encriptación.
- Conversor de palabras a código aeronáutico.

### 🗺️ Claves de ciudades

Incluye las claves y ciudades proporcionadas en el material de estudio.

Permite:

- Consultar las claves.
- Buscar ciudades y códigos.
- Practicar mediante preguntas.
- Jugar memorama.
- Identificar claves correctamente.

### 🏨 Terminología hotelera

Incluye términos utilizados en el sector hotelero, acompañados de su significado.

Incluye:

- Tarjetas de estudio.
- Buscador.
- Preguntas de práctica.
- Memorama.
- Ejercicios de reconocimiento y escritura.
- Pronunciación en inglés para términos que originalmente están en inglés.

### 🧾 Abreviaturas hoteleras

Contiene las abreviaturas incluidas en el material de estudio y su significado correspondiente.

Permite:

- Consultar abreviaturas.
- Buscar conceptos.
- Practicar mediante preguntas.
- Memorizar mediante juegos.

---

## 📝 Examen

Turismo Lab incluye un modo de **examen general** en el que el usuario puede seleccionar qué temas desea evaluar:

- Abecedario aeronáutico
- Claves de ciudades
- Terminología hotelera
- Abreviaturas hoteleras

El examen está dividido por secciones y cada sección contiene preguntas relacionadas exclusivamente con el tema seleccionado.

Al finalizar se muestra:

- Promedio general.
- Promedio individual por sección.
- Respuestas contestadas.
- Respuestas correctas.
- Respuestas incorrectas.
- Revisión detallada de cada pregunta.

El examen **no tiene límite de tiempo**.

---

## 🎨 Diseño

Turismo Lab utiliza un diseño basado en **glassmorphism**, buscando una apariencia moderna, limpia y agradable sin sobrecargar visualmente la interfaz.

Características principales:

- Interfaz minimalista.
- Transparencias y desenfoques.
- Animaciones sutiles.
- Diseño responsive.
- Adaptación para dispositivos móviles.
- Navegación sencilla.
- Enfoque en legibilidad y facilidad de uso.

---

## 🔊 Sistema de audio

La plataforma utiliza la API nativa `SpeechSynthesis` del navegador para reproducir pronunciaciones sin depender de servicios externos.

Esto permite:

- Escuchar términos del abecedario aeronáutico.
- Escuchar términos profesionales en inglés.
- Reproducir secuencias completas.
- Utilizar distintos dispositivos sin configurar servicios adicionales.

La pronunciación disponible puede variar dependiendo de las voces instaladas en el dispositivo y del navegador utilizado.

---

## 🛠️ Tecnologías utilizadas

Turismo Lab fue desarrollado utilizando únicamente tecnologías web nativas:

- **HTML5**
- **CSS3**
- **JavaScript**
- **Web Speech API / SpeechSynthesis**

No utiliza:

- Frameworks frontend.
- Backend.
- Bases de datos.
- APIs externas.
- Sistema de cuentas.
- Autenticación.
- Servidores propios.

Esto permite que el proyecto sea ligero, sencillo de mantener y fácil de desplegar.

---

## 📂 Estructura del proyecto

```text
Turismo-Lab/
│
├── turismo-lab/
│   ├── index.html
│   │
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── data.js
│       └── main.js
│
└── README.md
