import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blanq</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
})