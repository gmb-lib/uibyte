import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// The package ships its source, so this library build is a compile check rather
// than the artifact a consumer installs: every entry must parse, resolve and
// bundle before a tag is cut. Peer packages stay external — a component library
// that bundles its own copy of Vue breaks the host application.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'vue',
        'reka-ui',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
      ],
    },
  },
})
