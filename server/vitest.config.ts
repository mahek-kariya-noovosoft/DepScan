import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    setupFiles: ['./src/db/test-setup.ts'],
    // Run test files sequentially to prevent concurrent SQLite write-lock conflicts
    fileParallelism: false,
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
})
