import { createApp } from 'vinxi'
import tsconfigPaths from 'vite-tsconfig-paths'

export default createApp({
  routers: [
    {
      name: 'public',
      type: 'static',
      dir: './public',
    },
    {
      name: 'ssr',
      type: 'http',
      handler: './app/entry-server.tsx',
      target: 'server',
    },
    {
      name: 'client',
      type: 'client',
      handler: './app/entry-client.tsx',
      target: 'browser',
      base: '/_build',
    },
  ],
  vite: {
    plugins: [
      tsconfigPaths(),
    ],
  },
})