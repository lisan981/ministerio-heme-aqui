# App de Notas (Offline)

Aplicación web simple para crear, buscar, editar y eliminar notas. Los datos se guardan en `localStorage`, por lo que funcionan sin conexión y permanecen en tu navegador.

## Ejecutar localmente

1. Abre `index.html` directamente en tu navegador, o
2. Sirve la carpeta con un servidor estático:

```bash
# Con Python 3
python3 -m http.server 8080 --directory /workspace/app
# Luego visita: http://localhost:8080
```

## Funcionalidades

- Crear nota con título y contenido
- Editar y eliminar notas existentes
- Búsqueda instantánea por título y contenido
- Persistencia local (no se envía información a ningún servidor)

## Estructura

```
/workspace/app
├── index.html
├── assets/
│   ├── app.js
│   └── style.css
└── README.md
```