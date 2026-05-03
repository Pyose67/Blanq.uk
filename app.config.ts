import { defineConfig } from 'vinxi'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  vite: {
    plugins: [
      tsconfigPaths(),
    ],
  },
})