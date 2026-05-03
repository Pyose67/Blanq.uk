import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const clientManifest = import.meta.env.MANIFEST['client']
  const assets = await clientManifest.inputs[clientManifest.handler].assets()

  const assetTags = assets
    .map((asset: any) => {
      const href = asset.attrs?.href || asset.attrs?.src || ''
      if (href.endsWith('.js')) {
        return `<script type="module" src="${href}"></script>`
      }
      if (href.endsWith('.css')) {
        return `<link rel="stylesheet" href="${href}" />`
      }
      return ''
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blanq</title>
  ${assetTags}
</head>
<body>
  <div id="root"></div>
</body>
</html>`
})