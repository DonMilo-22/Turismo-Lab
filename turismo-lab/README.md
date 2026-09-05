# Turismo Lab v2

Web estática educativa para estudiantes de Turismo.

## Stack
- HTML5
- CSS3
- JavaScript Vanilla
- Speech Synthesis API del navegador
- Compatible con Vercel como sitio estático

## Contenido
La información de esta versión está basada en el material proporcionado para el proyecto: abecedario fonético aeronáutico, claves de ciudades, terminología hotelera y abreviaturas hoteleras.

## Estructura
```text
turismo-lab/
├── index.html
├── README.md
├── css/
│   └── style.css
└── js/
    ├── data.js
    └── main.js
```

## Ejecutar localmente
```bash
python3 -m http.server 8000
```
Luego abre `http://localhost:8000`.

## Deploy en Vercel
Sube esta carpeta a GitHub y crea un nuevo proyecto en Vercel usando el repositorio. No se requiere build command ni backend.

## Audio
- Abecedario y términos hoteleros en inglés usan una voz `en-US` cuando el dispositivo dispone de ella.
- Definiciones y contenidos en español usan `es-MX` cuando está disponible.
- Las voces disponibles dependen del sistema operativo y del navegador.
