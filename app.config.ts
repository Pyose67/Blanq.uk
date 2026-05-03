import { defineConfig } from 'vinxi'
import tsconfigPaths from 'vite-tsconfig-paths'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  vite: {
    plugins: [
      tsconfigPaths(),
      TanStackRouterVite({
        routesDirectory: './app/routes',
        generatedRouteTree: './app/routeTree.gen.ts',
      }),
    ],
  },
})