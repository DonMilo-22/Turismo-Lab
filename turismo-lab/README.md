# Turismo Lab

Mini plataforma educativa estática para estudiantes de turismo.

## Tecnología

- HTML5
- CSS3
- JavaScript Vanilla
- Web Speech API (`speechSynthesis`) para pronunciación
- Sin backend, base de datos, cuentas ni APIs externas de datos
- Compatible con despliegue estático en Vercel

## Estructura

```text
turismo-lab/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── data.js
│   └── main.js
└── README.md
```

## Ejecutar localmente

Puedes abrir `index.html` directamente en el navegador. Para una experiencia más cercana a producción, también puedes usar un servidor local sencillo:

```bash
python3 -m http.server 8000
```

Luego entra a `http://localhost:8000`.

## Desplegar en Vercel

1. Sube la carpeta a un repositorio de GitHub.
2. Importa el repositorio en Vercel.
3. No necesitas configurar un framework.
4. Puedes dejar el build command vacío y usar la carpeta raíz como directorio del proyecto.

## Nota sobre el contenido

Los términos mostrados en `js/data.js` siguen el material de estudio proporcionado para Turismo Lab. Si el material de clase cambia, actualiza ese archivo sin necesidad de tocar la interfaz.
