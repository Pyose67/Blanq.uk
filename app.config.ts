import { defineConfig } from '@tanstack/react-start/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  tsr: {
    routesDirectory: './app/routes',
    generatedRouteTree: './app/routeTree.gen.ts',
  },
  vite: {
    plugins: [tsconfigPaths()],
  },
})