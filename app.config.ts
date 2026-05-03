import { createApp } from 'vinxi'
import tsconfigPaths from 'vite-tsconfig-paths'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default createApp({
  routers: [
    {
      name: 'public',
      type: 'static',
      dir: './public',
    },
    {
      name: 'client',
      type: 'client',
      handler: './app/entry-client.tsx',
      target: 'browser',
      base: '/_build',
    },
    {
      name: 'ssr',
      type: 'http',
      handler: './app/entry-server.tsx',
      target: 'server',
    },
  ],
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