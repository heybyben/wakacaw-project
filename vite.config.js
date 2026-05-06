import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Makes it easier to deploy to GitHub Pages subfolders
  build: {
    outDir: 'dist',
  }
})
