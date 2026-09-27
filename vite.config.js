import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // El navegador bloquea las llamadas entre orígenes distintos (esto es CORS): la página corre en
    // el 5173 y el backend en el 8080. El proxy evita el problema sin tocar el backend: el navegador
    // cree que todo sale del 5173 y Vite reenvía por detrás.
    proxy: {
      '/api/catalogo': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Kong quita el prefijo /api/catalogo antes de llegar al servicio (strip_path).
        // Aquí se hace lo mismo, para que el código sea idéntico en desarrollo y en integración.
        rewrite: (ruta) => ruta.replace(/^\/api\/catalogo/, ''),
      },
    },
  },
})