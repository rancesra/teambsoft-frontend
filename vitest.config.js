import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Se mezcla con la configuración de Vite para heredar el alias "@": los componentes importan
// "@/utilidades/formato" y sin esto las pruebas no encontrarían el archivo.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: { environment: 'jsdom' },
  }),
)
