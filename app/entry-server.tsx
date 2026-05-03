import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const clientManifest = import.meta.env.MANIFEST['client']
  const assets = await clientManifest.inputs[clientManifest.handler].assets()

  const assetTags = assets
    .map((asset: any) => {
      if (asset.tag === 'script') {
        return `<script type="module" src="${asset.attrs.src}"></script>`
      }
      if (asset.tag === 'link') {
        return `<link rel="stylesheet" href="${asset.attrs.href}" />`
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