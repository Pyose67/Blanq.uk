import { defineConfig } from '@tanstack/react-start/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  vite: {
    plugins: [
      TanStackRouterVite({ autoCodeSplitting: true }), // <-- O HERÓI AQUI
      tsconfigPaths(),
    ],
  },
})