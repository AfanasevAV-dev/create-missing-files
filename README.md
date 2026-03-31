# Create Missing Files

Create missing files from imports with one click.

![Demo](https://raw.githubusercontent.com/AfanasevAV-dev/create-missing-files/main/demo.gif)

## How it works

When you import a file that doesn't exist, this extension shows a quick action to create it.

### Hover

Hover over any import path and click "Create File".

### CodeLens

A "Create File" button appears above any missing import.

### Settings

- `createMissingFiles.autoCreate` - Auto-create files without asking (default: off)
- `createMissingFiles.extensions` - File extensions to watch (default: .scss, .css, .js, .ts, .jsx, .tsx, .json, .vue)
- `createMissingFiles.aliases` - Short path aliases (e.g. `{"@": "./src"}` turns `@/components/Button` into `./src/components/Button`)

#### Aliases

Add path aliases in VS Code settings:

```json
"createMissingFiles.aliases": {
  "@": "./src",
  "~": "./"
}
```

Then imports like `import Button from '@/components/Button'` will work.

## Supports

- JavaScript, TypeScript
- React, Vue
- SCSS, CSS
