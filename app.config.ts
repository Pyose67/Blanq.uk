import { defineConfig } from 'vinxi/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  vite: {
    plugins: [
      tsconfigPaths(),
    ],
  },
})