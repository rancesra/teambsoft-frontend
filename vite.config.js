import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// A dónde reenvía Vite las llamadas a /api/catalogo:
// - Sin variables: al backend de Catálogo corriendo solo en http://localhost:8080, sin Kong.
// - Con KONG_URL (por ejemplo http://localhost:8000): a Kong, como en el docker-compose de integración,
//   donde el 8080 no está publicado y todo entra por Kong.
// - Con CATALOGO_URL: al backend directo, pero en otra dirección (si el 8080 está ocupado).
const kong = process.env.KONG_URL
const catalogo = process.env.CATALOGO_URL ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // Puerto fijo del módulo de Catálogo (contrato del Host App v1.2, requisito 1). Con strictPort,
    // si el 5173 está ocupado Vite se detiene en vez de saltar a otro puerto: el Host App y el CORS
    // de Kong esperan el módulo exactamente aquí.
    port: 5173,
    strictPort: true,
    // El navegador bloquea las llamadas entre orígenes distintos (esto es CORS). El proxy evita el
    // problema: el navegador cree que todo sale del 5173 y Vite reenvía por detrás.
    proxy: {
      '/api/catalogo': kong
        ? // Kong ya quita el prefijo /api/catalogo (strip_path): se le reenvía la ruta tal cual.
          { target: kong, changeOrigin: true }
        : {
            target: catalogo,
            changeOrigin: true,
            // Sin Kong, el prefijo lo quita el proxy, para que el código sea idéntico en los dos casos.
            rewrite: (ruta) => ruta.replace(/^\/api\/catalogo/, ''),
          },
    },
  },
})
