# Pulpería Comunitaria

App React + Vite con Tailwind y Firebase.

## Configuración rápida

1) Instalar dependencias:
```bash
npm install
```

2) Configurar Firebase (opcional para probar sin auth real):
- En `index.html` puedes definir:
```html
<script>
  window.__app_id = 'pulperia-app';
  window.__firebase_config = '{}'; // pega aquí tu JSON de Firebase
  // window.__initial_auth_token = '...'; // opcional
</script>
```
- Si dejas `{}`, la app mostrará un mensaje de configuración faltante y no leerá datos reales.

3) Ejecutar en desarrollo:
```bash
npm run dev
```

4) Compilar producción:
```bash
npm run build
```
Los artefactos quedan en `dist/`.

## Despliegue estático
Puedes servir `dist/` con cualquier hosting estático (Vercel, Netlify, GitHub Pages) o localmente:
```bash
npx serve dist
```

## Notas
- Tailwind v4 (PostCSS plugin `@tailwindcss/postcss`).
- Firebase se inicializa sólo si `window.__firebase_config` contiene un JSON válido.
